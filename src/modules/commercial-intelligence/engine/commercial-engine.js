import {
  companyKey,
  isAnonymousCompany,
  cleanupReason
} from "../../../shared/company-utils.js";

import {
  productFromEvent,
  productCode,
  productName,
  productLabel,
  productQuantity,
  productValue,
  quoteProducts,
  quoteItemsCount
} from "../../../shared/product-utils.js";

import {
  money,
  percent
} from "../../../shared/formatting.js";

import {
  startOfDay,
  dateTime,
  crmContactDate,
  dateOnly
} from "../../../shared/dates.js";

import {
  normalizeConsultant,
  normalizeCompany,
  safeNumber
} from "../../../shared/normalization.js";

import {
  ACTIVE_PIPELINE_STAGE_KEYS
} from "../../crm/engine/pipeline-config.js";

import {
  crmStatusLabel,
  purchaseDays
} from "../../crm/engine/crm-utils.js";

function hasCommercialOpportunity(client, activities = [], tasks = [], demands = []) {
  if (!client || !ACTIVE_PIPELINE_STAGE_KEYS.has(client.statusKey)) return false;
  if (client.statusKey !== "new") return true;
  if (safeNumber(client.totalActions) > 0 || safeNumber(client.activeCartQty) > 0 || safeNumber(client.quotes) > 0 || safeNumber(client.expectedValue) > 0) return true;
  const key = client.companyKey;
  return tasks.some((task) => task.companyKey === key && task.status === "open")
    || activities.some((activity) => activity.companyKey === key && !activity.deletedAt && activity.type !== "stage_change")
    || demands.some((demand) => companyKey(demand.companyKey || demand.companyName) === key && !["resolved", "cancelled"].includes(String(demand.status || "open")));
}

function commercialEventScore(event) {
  if (!event) return 0;
  if (event.event === "page_view") return 1;
  if (event.event === "search" || event.event === "search_no_results") return 2;
  if (event.event === "product_open") return 3;
  if (event.event === "add_to_cart") return 5 * productQuantity(productFromEvent(event), event.quantity || 1);
  if (event.event === "whatsapp_quote") return 15;
  return 1;
}

function buildCartFollowUpContext(events = []) {
  const ordered = [...events].filter((event) => ["add_to_cart", "remove_from_cart", "clear_cart", "whatsapp_quote"].includes(event.event))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const lastAddIndex = ordered.reduce((result, event, index) => event.event === "add_to_cart" ? index : result, -1);
  if (lastAddIndex < 0) return { products: [], itemsCount: 0, total: 0 };
  let cutoff = -1;
  for (let index = lastAddIndex - 1; index >= 0; index--) {
    if (["clear_cart", "whatsapp_quote"].includes(ordered[index].event)) { cutoff = index; break; }
  }
  let source = ordered.slice(cutoff + 1).filter((event) => event.event === "add_to_cart");
  if (!source.length) source = ordered.filter((event) => event.event === "add_to_cart").slice(-10);
  const grouped = new Map();
  source.forEach((event) => {
    const product = productFromEvent(event);
    const code = productCode(product);
    const name = productName(product);
    const key = code || name;
    if (!key) return;
    if (!grouped.has(key)) grouped.set(key, { code, name, quantity: 0, value: 0 });
    const row = grouped.get(key);
    row.quantity += productQuantity(product, event.quantity || 1);
    row.value += productValue(product, event);
  });
  const products = [...grouped.values()];
  return {
    products,
    itemsCount: products.reduce((sum, item) => sum + item.quantity, 0),
    total: products.reduce((sum, item) => sum + item.value, 0)
  };
}

function updateProductMetric(map, label, event, field, weight = 1) {
  if (!label || label === "Produto não informado") return;

  if (!map.has(label)) {
    map.set(label, {
      product: label,
      views: 0,
      carts: 0,
      quotes: 0,
      quotedItemsQty: 0,
      score: 0,
      lastEventDate: null
    });
  }

  const row = map.get(label);
  row[field] += weight;

  const currentDate = new Date(event.timestamp);
  if (!Number.isNaN(currentDate.getTime()) && (!row.lastEventDate || currentDate > row.lastEventDate)) {
    row.lastEventDate = currentDate;
  }
}

function commercialProductRows({ productOpen = [], added = [], quotes = [] }) {
  const map = new Map();

  productOpen.forEach((event) => {
    updateProductMetric(map, productLabel(productFromEvent(event)), event, "views", 1);
  });

  added.forEach((event) => {
    const product = productFromEvent(event);
    updateProductMetric(map, productLabel(product), event, "carts", productQuantity(product, event.quantity || 1));
  });

  quotes.forEach((event) => {
    quoteProducts(event).forEach((product) => {
      updateProductMetric(map, productLabel(product), event, "quotes", productQuantity(product, 1));
    });
  });

  return [...map.values()]
    .map((row) => {
      const score = row.views + (row.carts * 3) + (row.quotes * 10);
      const conversionRate = row.views ? row.quotes / row.views : 0;
      return {
        ...row,
        score,
        conversionRate,
        conversion: row.views ? `${(conversionRate * 100).toFixed(1).replace(".", ",")}%` : "-",
        lastEvent: row.lastEventDate ? dateTime(row.lastEventDate) : "-",
        _search: ""
      };
    })
    .sort((a, b) => b.score - a.score || b.quotes - a.quotes || b.carts - a.carts || b.views - a.views)
    .map((row, index) => {
      const formatted = { ...row, position: index + 1 };
      formatted._search = [
        formatted.position,
        formatted.product,
        formatted.views,
        formatted.carts,
        formatted.quotes,
        formatted.score,
        formatted.conversion,
        formatted.lastEvent
      ].join(" ").toLowerCase();
      return formatted;
    });
}

function buildCrmRows(events, reservations, crmClients) {
  const metadata = new Map(crmClients.map((client) => [companyKey(client.companyKey || client.companyName), client]));
  const archivedKeys = new Set(crmClients.filter((client) => String(client.archivedAt || "").trim()).map((client) => companyKey(client.companyKey || client.companyName)));
  const map = new Map();
  const carts = new Map();
  reservations.forEach((item) => {
    const key = companyKey(item.company);
    if (!key) return;
    if (!carts.has(key)) carts.set(key, { reserved: 0, excess: 0, products: new Set() });
    const cart = carts.get(key);
    cart.reserved += item.reservedNumber;
    cart.excess += item.excessNumber;
    if (item.product) cart.products.add(item.product);
  });

  crmClients.forEach((client) => {
    const company = normalizeCompany(client.companyName);
    const key = companyKey(client.companyKey || company);
    if (!key || archivedKeys.has(key) || cleanupReason(company) || map.has(key)) return;
    map.set(key, {
      companyKey: key,
      company,
      consultant: client.owner ? normalizeConsultant(client.owner).toUpperCase() : "SEM_CONSULTOR",
      totalActions: 0,
      accesses: 0,
      searches: 0,
      noResults: 0,
      productOpen: 0,
      added: 0,
      quotes: 0,
      quotedItemsQty: 0,
      quoteTotalNumber: 0,
      score: 0,
      days: new Set(),
      products: new Map(),
      lastEventRaw: ""
    });
  });

  events.forEach((event) => {
    const company = normalizeCompany(event.companyName);
    if (isAnonymousCompany(company) || cleanupReason(company)) return;
    const key = companyKey(company);
    if (archivedKeys.has(key)) return;
    if (!map.has(key)) {
      map.set(key, {
        companyKey: key,
        company,
        consultant: normalizeConsultant(event.consultant).toUpperCase(),
        totalActions: 0,
        accesses: 0,
        searches: 0,
        noResults: 0,
        productOpen: 0,
        added: 0,
        quotes: 0,
        quotedItemsQty: 0,
        quoteTotalNumber: 0,
        score: 0,
        days: new Set(),
        products: new Map(),
        lastEventRaw: ""
      });
    }
    const row = map.get(key);
    row.totalActions++;
    row.score += commercialEventScore(event);
    if (event.event === "page_view") row.accesses++;
    if (event.event === "search" || event.event === "search_no_results") row.searches++;
    if (event.event === "search_no_results") row.noResults++;
    if (event.event === "product_open") row.productOpen++;
    if (event.event === "add_to_cart") row.added += productQuantity(productFromEvent(event), event.quantity || 1);
    if (event.event === "whatsapp_quote") {
      row.quotes++;
      row.quotedItemsQty += quoteItemsCount(event);
      row.quoteTotalNumber += safeNumber(event.cartTotal || event.total);
    }
    const date = new Date(event.timestamp);
    if (!Number.isNaN(date.getTime())) {
      row.days.add(date.toDateString());
      if (!row.lastEventRaw || date > new Date(row.lastEventRaw)) {
        row.lastEventRaw = event.timestamp;
        row.consultant = normalizeConsultant(event.consultant).toUpperCase();
      }
    }
    const product = productFromEvent(event);
    const label = productLabel(product);
    if (label !== "Produto não informado") {
      row.products.set(label, (row.products.get(label) || 0) + Math.max(1, productQuantity(product, 1)));
    }
  });

  reservations.forEach((item) => {
    const company = normalizeCompany(item.company);
    if (isAnonymousCompany(company) || cleanupReason(company)) return;
    const key = companyKey(company);
    if (archivedKeys.has(key)) return;
    if (map.has(key)) return;
    map.set(key, {
      companyKey: key,
      company,
      consultant: normalizeConsultant(item.consultant).toUpperCase(),
      totalActions: 0,
      accesses: 0,
      searches: 0,
      noResults: 0,
      productOpen: 0,
      added: 0,
      quotes: 0,
      quotedItemsQty: 0,
      quoteTotalNumber: 0,
      score: 0,
      days: new Set(),
      products: new Map(),
      lastEventRaw: ""
    });
  });

  return [...map.values()].map((row) => {
    const meta = metadata.get(row.companyKey) || {};
    const cart = carts.get(row.companyKey) || { reserved: 0, excess: 0, products: new Set() };
    const topProducts = [...row.products.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name);
    const statusKey = String(meta.status || (cart.reserved ? "negotiation" : row.quotes ? "quoted" : "new"));
    return {
      ...row,
      id: `crm-${row.companyKey}`,
      statusKey,
      status: crmStatusLabel(statusKey),
      customerCode: String(meta.customerCode || ""),
      taxId: String(meta.taxId || ""),
      contactName: String(meta.contactName || ""),
      phone: String(meta.phone || ""),
      email: String(meta.email || ""),
      city: String(meta.city || ""),
      state: String(meta.state || ""),
      address: String(meta.address || ""),
      route: String(meta.route || ""),
      daysWithoutPurchase: purchaseDays(meta),
      lastPurchaseAt: String(meta.lastPurchaseAt || ""),
      lastPurchaseValue: safeNumber(meta.lastPurchaseValue),
      purchaseTotal: safeNumber(meta.purchaseTotal),
      purchaseCount: safeNumber(meta.purchaseCount),
      averagePurchaseIntervalDays: safeNumber(meta.averagePurchaseIntervalDays),
      segment: String(meta.segment || ""),
      owner: meta.owner ? normalizeConsultant(meta.owner).toUpperCase() : row.consultant,
      nextContactAt: String(meta.nextContactAt || ""),
      nextContact: meta.nextContactAt ? dateOnly(meta.nextContactAt) : "-",
      tags: String(meta.tags || ""),
      notes: String(meta.notes || ""),
      expectedValue: safeNumber(meta.expectedValue),
      lastOutcome: String(meta.lastOutcome || ""),
      lostReason: String(meta.lostReason || ""),
      funnelExitReason: String(meta.funnelExitReason || ""),
      funnelExitAt: String(meta.funnelExitAt || ""),
      actionDoneAt: String(meta.actionDoneAt || ""),
      archivedAt: String(meta.archivedAt || ""),
      activeCartQty: cart.reserved,
      cartExcessQty: cart.excess,
      activeCartProducts: [...cart.products].slice(0, 8),
      topProducts,
      itemCount: Math.max(cart.reserved, row.quotedItemsQty, topProducts.length),
      activeDays: row.days.size,
      quoteRate: percent(row.productOpen ? row.quotes / row.productOpen : 0),
      quoteTotal: money(row.quoteTotalNumber),
      lastEvent: row.lastEventRaw ? dateTime(row.lastEventRaw) : "-",
      _search: [row.company, row.consultant, crmStatusLabel(statusKey), meta.customerCode, meta.taxId, meta.contactName, meta.phone, meta.email, meta.city, meta.state, meta.address, meta.route, meta.segment, meta.tags, meta.funnelExitReason, ...topProducts].join(" ").toLowerCase()
    };
  }).sort((a, b) => b.score - a.score || new Date(b.lastEventRaw) - new Date(a.lastEventRaw));
}

function buildCartInterestHistory(events, reservations, crmRows, crmClients = []) {
  const crmMap = new Map(crmRows.map((client) => [client.companyKey, client]));
  const archivedKeys = new Set(crmClients.filter((client) => String(client.archivedAt || "").trim()).map((client) => companyKey(client.companyKey || client.companyName)));
  const activeByCompany = new Map();
  reservations.forEach((item) => {
    const key = companyKey(item.company);
    if (!key) return;
    activeByCompany.set(key, (activeByCompany.get(key) || 0) + safeNumber(item.reservedNumber));
  });
  const map = new Map();
  [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach((event) => {
    if (!["add_to_cart", "remove_from_cart", "clear_cart", "whatsapp_quote"].includes(event.event)) return;
    const company = normalizeCompany(event.companyName);
    if (isAnonymousCompany(company) || cleanupReason(company)) return;
    const key = companyKey(company);
    if (archivedKeys.has(key)) return;
    if (!map.has(key)) map.set(key, {
      companyKey: key,
      company,
      consultant: normalizeConsultant(event.consultant).toUpperCase(),
      products: new Map(),
      addedSignals: 0,
      quoteCount: 0,
      lastAddAt: 0,
      lastQuoteAt: 0,
      lastActivityAt: 0,
      events: []
    });
    const row = map.get(key);
    row.events.push(event);
    const timestamp = new Date(event.timestamp).getTime() || 0;
    row.lastActivityAt = Math.max(row.lastActivityAt, timestamp);
    row.consultant = normalizeConsultant(event.consultant).toUpperCase();
    if (event.event === "add_to_cart") {
      const product = productFromEvent(event);
      const label = productLabel(product);
      const quantity = productQuantity(product, event.quantity || 1);
      if (label !== "Produto não informado") row.products.set(label, (row.products.get(label) || 0) + quantity);
      row.addedSignals += quantity;
      row.lastAddAt = Math.max(row.lastAddAt, timestamp);
    }
    if (event.event === "whatsapp_quote") {
      row.quoteCount += 1;
      row.lastQuoteAt = Math.max(row.lastQuoteAt, timestamp);
      quoteProducts(event).forEach((product) => {
        const label = productLabel(product);
        if (label !== "Produto não informado" && !row.products.has(label)) row.products.set(label, productQuantity(product, 1));
      });
    }
  });

  return [...map.values()].filter((row) => row.addedSignals > 0).map((row) => {
    const client = crmMap.get(row.companyKey);
    const activeQty = activeByCompany.get(row.companyKey) || 0;
    const needsContact = !activeQty && row.lastAddAt > row.lastQuoteAt;
    const labels = [...row.products.keys()];
    const followUpContext = buildCartFollowUpContext(row.events);
    const statusKey = activeQty ? "active" : needsContact ? "interest" : "quoted";
    const businessStatusKey = client?.statusKey === "won" ? "won" : client?.statusKey === "lost" ? "lost" : row.quoteCount ? "quoted" : "pending";
    return {
      ...row,
      id: `cart-interest-${row.companyKey}`,
      client,
      phone: client?.phone || "",
      activeQty,
      needsContact,
      productsCount: labels.length,
      itemsCount: row.addedSignals,
      estimatedTotal: followUpContext.total,
      followUpContext,
      productsSummary: labels.length > 2 ? `${labels.slice(0, 2).join("; ")} +${labels.length - 2}` : labels.join("; "),
      statusKey,
      businessStatusKey,
      businessStatus: businessStatusKey === "won" ? "Pedido fechado" : businessStatusKey === "lost" ? "Perdido" : businessStatusKey === "quoted" ? "Cotação enviada" : "Pendente",
      status: activeQty ? "No carrinho agora" : needsContact ? "Reserva expirada · mostrou interesse" : "Cotação enviada",
      lastActivity: row.lastActivityAt ? dateTime(row.lastActivityAt) : "-",
      _search: [row.company, client?.customerCode, client?.contactName, client?.phone, row.consultant, ...labels].join(" ").toLowerCase()
    };
  }).sort((a, b) => Number(b.needsContact) - Number(a.needsContact) || b.lastActivityAt - a.lastActivityAt);
}

function buildOpportunityRows(crmRows, events) {
  const eventSignals = new Map();
  events.forEach((event) => {
    const key = companyKey(event.companyName);
    if (!key || cleanupReason(event.companyName)) return;
    if (!eventSignals.has(key)) eventSignals.set(key, { lastAdd: 0, lastQuote: 0, lastSignalAt: 0, lastNoResultAt: 0, lastNoResult: "", lastProduct: "" });
    const signal = eventSignals.get(key);
    const timestamp = new Date(event.timestamp).getTime() || 0;
    signal.lastSignalAt = Math.max(signal.lastSignalAt, timestamp);
    if (event.event === "add_to_cart") signal.lastAdd = Math.max(signal.lastAdd, timestamp);
    if (event.event === "whatsapp_quote") signal.lastQuote = Math.max(signal.lastQuote, timestamp);
    if (event.event === "search_no_results" && timestamp >= signal.lastNoResultAt) { signal.lastNoResult = event.query || signal.lastNoResult; signal.lastNoResultAt = timestamp; }
    const label = productLabel(productFromEvent(event));
    if (label !== "Produto não informado") signal.lastProduct = label;
  });

  return crmRows.map((client) => {
    const signal = eventSignals.get(client.companyKey) || {};
    let priority = 0;
    let level = "medium";
    let reason = "";
    if (client.cartExcessQty > 0) {
      priority = 110;
      level = "urgent";
      reason = `${client.cartExcessQty} unidade(s) acima do estoque aguardando atendimento`;
    } else if (client.activeCartQty > 0) {
      priority = 100;
      level = "hot";
      reason = `Carrinho ativo com ${client.activeCartQty} unidade(s) reservada(s)`;
    } else if ((signal.lastAdd || 0) > (signal.lastQuote || 0)) {
      priority = 90;
      level = "hot";
      reason = "Adicionou produtos, mas ainda não enviou cotação";
    } else if (signal.lastQuote && Date.now() - signal.lastQuote <= 3 * 86400000) {
      priority = 80;
      level = "high";
      reason = `Cotação recente de ${money(client.quoteTotalNumber)}`;
    } else if (signal.lastNoResult) {
      priority = 70;
      level = "high";
      reason = `Não encontrou: ${signal.lastNoResult}`;
    } else if (client.productOpen >= 3 && !client.quotes) {
      priority = 60;
      reason = `${client.productOpen} produtos abertos sem cotação`;
    } else if (client.lastEventRaw && Date.now() - new Date(client.lastEventRaw).getTime() >= 15 * 86400000) {
      priority = 30;
      level = "cold";
      reason = "Cliente sem atividade há mais de 15 dias";
    }
    const signalAt = signal.lastSignalAt || new Date(client.lastEventRaw).getTime() || 0;
    if (client.actionDoneAt && new Date(client.actionDoneAt).getTime() >= signalAt) reason = "";
    const unmetDemand = priority === 70 ? signal.lastNoResult : "";
    return {
      ...client,
      priority,
      level,
      reason,
      actionSignalAt: signalAt,
      unmetDemand,
      interest: unmetDemand || client.activeCartProducts[0] || signal.lastProduct || client.topProducts[0] || "-"
    };
  }).filter((row) => row.reason).sort((a, b) => b.priority - a.priority || b.score - a.score);
}

function commercialHealth(client = {}) {
  const days = purchaseDays(client);
  if (!client.lastPurchaseAt && !days) return { key: "no_history", label: "Sem histórico de compra" };
  if (days <= 30) return { key: "active", label: "Comprou recentemente" };
  if (days <= 60) return { key: "attention", label: "31–60 dias sem comprar" };
  if (days <= 120) return { key: "risk", label: "61–120 dias sem comprar" };
  return { key: "inactive", label: "Sem compra há +120 dias" };
}

function buildActionCenterRows(opportunities, tasks, crmRows) {
  const clientMap = new Map(crmRows.map((client) => [client.companyKey, client]));
  const now = new Date();
  const taskRows = tasks.filter((task) => task.status === "open").map((task) => {
    const client = clientMap.get(task.companyKey) || {
      id: `crm-${task.companyKey}`,
      companyKey: task.companyKey,
      company: task.companyName,
      owner: task.owner,
      statusKey: "contact",
      status: crmStatusLabel("contact"),
      topProducts: [],
      activeCartProducts: [],
      quoteTotal: money(0),
      score: 0
    };
    const due = crmContactDate(task.dueAt);
    const overdue = due && due.getTime() < now.getTime();
    const dueToday = due && due.toDateString() === now.toDateString();
    const priority = overdue ? 125 : dueToday ? 115 : task.priority === "urgent" ? 110 : task.priority === "high" ? 95 : 75;
    return {
      ...client,
      id: `action-task-${task.taskId}`,
      actionType: "task",
      taskId: task.taskId,
      dueAt: task.dueAt,
      priority,
      level: overdue ? "urgent" : priority >= 110 ? "hot" : "high",
      reason: overdue ? `Retorno atrasado: ${task.title}` : dueToday ? `Retorno para hoje: ${task.title}` : task.title,
      interest: task.dueAt ? `Prazo: ${dateTime(task.dueAt)}` : "Sem prazo definido"
    };
  });
  const opportunityActions = opportunities.map((item) => ({ ...item, actionType: "opportunity", id: `action-${item.id}` }));
  return [...taskRows, ...opportunityActions].sort((a, b) => b.priority - a.priority || b.score - a.score);
}

function buildDemandStockRows(events, catalogProducts, reservations, crmRows = [], manualDemands = []) {
  const signalPriority = { unavailable: 5, priority: 4, restocked: 3, pressure: 2, no_snapshot: 1, normal: 0 };
  const catalog = new Map(catalogProducts.map((item) => [String(item.productCode || "").trim(), item]));
  const clientMap = new Map(crmRows.map((client) => [client.companyKey, client]));
  const reserved = new Map();
  reservations.forEach((item) => {
    const code = String(item.productCode || "").trim();
    if (code) reserved.set(code, (reserved.get(code) || 0) + safeNumber(item.reservedNumber ?? item.reservedQty));
  });
  const map = new Map();
  function touch(product, type, quantity = 1, event = {}) {
    const code = String(product?.productCode || product?.code || "").trim();
    if (!code) return;
    if (!map.has(code)) map.set(code, { productCode: code, productName: String(product?.productName || product?.name || ""), searches: 0, views: 0, carts: 0, quotes: 0, manual: 0, clients: new Map() });
    const row = map.get(code);
    if (type === "search") row.searches += 1;
    if (type === "view") row.views += 1;
    if (type === "cart") row.carts += Math.max(1, safeNumber(quantity));
    if (type === "quote") row.quotes += Math.max(1, safeNumber(quantity));
    if (type === "manual") row.manual += Math.max(1, safeNumber(quantity));
    const company = normalizeCompany(event.companyName);
    const key = companyKey(company);
    if (key && !isAnonymousCompany(company) && !cleanupReason(company)) {
      if (!row.clients.has(key)) row.clients.set(key, { companyKey: key, company, consultant: normalizeConsultant(event.consultant).toUpperCase(), searches: 0, views: 0, carts: 0, quotes: 0, manual: 0, lastAt: 0 });
      const client = row.clients.get(key);
      client[type === "search" ? "searches" : type === "view" ? "views" : type === "cart" ? "carts" : type === "manual" ? "manual" : "quotes"] += Math.max(1, safeNumber(quantity));
      client.lastAt = Math.max(client.lastAt, new Date(event.timestamp).getTime() || 0);
    }
  }
  events.forEach((event) => {
    if (event.event === "product_open") touch(productFromEvent(event), "view", 1, event);
    if (event.event === "add_to_cart") touch(productFromEvent(event), "cart", event.quantity, event);
    if (event.event === "whatsapp_quote") quoteProducts(event).forEach((product) => touch(product, "quote", productQuantity(product, 1), event));
    // Pesquisas ficam em uma leitura própria e nunca são distribuídas entre SKUs.
  });
  manualDemands.filter((item) => String(item.status || "open") === "open").forEach((item) => {
    const fallbackCode = `SEM-CODIGO:${companyKey(item.productName || "item") || "ITEM"}`;
    touch({ productCode: item.productCode || fallbackCode, productName: item.productName }, "manual", item.requestedQty, { companyName: item.companyName, consultant: item.owner, timestamp: item.createdAt });
  });
  return [...map.values()].map((row) => {
    const product = catalog.get(row.productCode) || {};
    const stockQty = safeNumber(product.stockQty);
    const reservedQty = reserved.get(row.productCode) || 0;
    const availableQty = Math.max(0, stockQty - reservedQty);
    const demandScore = row.searches * 2 + row.views + row.carts * 3 + row.quotes * 10 + row.manual * 10;
    const pressure = demandScore && catalog.has(row.productCode) ? demandScore / Math.max(1, availableQty) : 0;
    let signal = "Demanda normal";
    let signalKey = "normal";
    if (!catalog.has(row.productCode)) signal = "Sem snapshot de estoque";
    if (!catalog.has(row.productCode)) signalKey = "no_snapshot";
    else if (availableQty <= 0 && demandScore) { signal = "Procura sem disponibilidade"; signalKey = "unavailable"; }
    else if (product.restockedAt && safeNumber(product.previousStockQty) <= 0 && stockQty > 0) { signal = "Estoque normalizado"; signalKey = "restocked"; }
    else if (pressure >= 8) { signal = "Reposição prioritária"; signalKey = "priority"; }
    else if (pressure >= 3) { signal = "Estoque sob pressão"; signalKey = "pressure"; }
    const clients = [...row.clients.values()].map((item) => {
      const crmClient = clientMap.get(item.companyKey) || null;
      return { ...(crmClient || {}), ...item, crmClient, company: item.company, consultant: item.consultant, lastAt: item.lastAt };
    }).sort((a, b) => b.quotes - a.quotes || b.carts - a.carts || b.searches - a.searches || b.views - a.views);
    return {
      ...row,
      id: `demand-${row.productCode}`,
      productName: row.productName || product.productName || "Produto sem descrição",
      brand: String(product.brand || ""),
      stockQty,
      reservedQty,
      availableQty,
      demandScore,
      searches: row.searches,
      manual: row.manual,
      pressure,
      signal,
      signalKey,
      clients,
      clientsCount: clients.length,
      restockedAt: product.restockedAt || "",
      _search: [row.productCode, row.productName, product.productName, product.brand, signal].join(" ").toLowerCase()
    };
  }).sort((a, b) => (signalPriority[b.signalKey] || 0) - (signalPriority[a.signalKey] || 0) || b.demandScore - a.demandScore);
}

function buildAlerts({ actionRows, tasks, reservationKpis, catalogHealth }) {
  const alerts = [];
  const overdue = tasks.filter((task) => task.status === "open" && crmContactDate(task.dueAt) && crmContactDate(task.dueAt) < startOfDay(new Date())).length;
  if (overdue) alerts.push({ level: "urgent", title: `${overdue} retorno(s) atrasado(s)`, detail: "Priorize os clientes com tarefa vencida.", view: "opportunities" });
  if (reservationKpis.excess) alerts.push({ level: "urgent", title: `${reservationKpis.excess} unidade(s) acima do estoque`, detail: "Há clientes aguardando consulta comercial.", view: "carts" });
  if (reservationKpis.carts) alerts.push({ level: "hot", title: `${reservationKpis.carts} carrinho(s) ativo(s)`, detail: "Reservas temporárias estão acontecendo agora.", view: "carts" });
  const urgentActions = actionRows.filter((item) => item.priority >= 100).length;
  if (urgentActions) alerts.push({ level: "high", title: `${urgentActions} oportunidade(s) prioritária(s)`, detail: "A fila comercial está ordenada por urgência.", view: "opportunities" });
  const latest = catalogHealth.latest;
  if (!latest) alerts.push({ level: "medium", title: "Monitor do catálogo aguardando integração", detail: "Envie o primeiro snapshot diário para ativar estoque e saúde da atualização.", view: "catalog" });
  else {
    const age = Date.now() - new Date(latest.createdAt).getTime();
    if (latest.status === "error") alerts.push({ level: "urgent", title: "Última atualização do catálogo falhou", detail: latest.errorMessage || "Confira o processo diário.", view: "catalog" });
    else if (age > 36 * 60 * 60 * 1000) alerts.push({ level: "high", title: "Catálogo sem atualização recente", detail: `Último registro: ${dateTime(latest.createdAt)}.`, view: "catalog" });
    if (safeNumber(latest.missingImageCount)) alerts.push({ level: "medium", title: `${latest.missingImageCount} produto(s) sem imagem`, detail: "Revise a qualidade visual do catálogo.", view: "catalog" });
  }
  return alerts;
}

function commercialInsightRows({ companyActivity, consultantActivity, dormantCompanies, noResultDemand, commercialProducts }) {
  const insights = [];

  const topCompany = companyActivity.find((row) => !isAnonymousCompany(row.company));
  if (topCompany) {
    insights.push({
      id: "insight-top-company",
      title: "Cliente mais quente",
      value: topCompany.company,
      detail: `${topCompany.score} pontos, ${topCompany.quotes} cotações e ${topCompany.quoteRate} de conversão.`,
      level: "success"
    });
  }

  const topConsultant = consultantActivity[0];
  if (topConsultant) {
    insights.push({
      id: "insight-top-consultant",
      title: "Consultor em destaque",
      value: `${topConsultant.consultant}`,
      detail: `${topConsultant.score} pontos e ${topConsultant.quotes} cotações no filtro atual.`,
      level: "info"
    });
  }

  const topDormant = dormantCompanies[0];
  if (topDormant) {
    insights.push({
      id: "insight-dormant",
      title: "Cliente esfriando",
      value: topDormant.company,
      detail: `Queda de ${topDormant.drop} no score comercial dos últimos 30 dias.`,
      level: "warning"
    });
  }

  const topDemand = noResultDemand[0];
  if (topDemand) {
    insights.push({
      id: "insight-demand",
      title: "Oportunidade de compra",
      value: topDemand.search,
      detail: `${topDemand.count} busca${topDemand.count === 1 ? "" : "s"} sem resultado.`,
      level: "warning"
    });
  }

  const topProduct = commercialProducts[0];
  if (topProduct) {
    insights.push({
      id: "insight-product",
      title: "Produto mais quente",
      value: topProduct.product,
      detail: `${topProduct.score} pontos, ${topProduct.quotes} cotações e ${topProduct.conversion} de conversão.`,
      level: "success"
    });
  }

  return insights;
}

function buildClientInterestRows(events = [], reservations = []) {
  const map = new Map();
  function get(product) {
    const code = productCode(product);
    const name = productName(product);
    const key = `${code}|${name}`;
    if (!code && !name) return null;
    if (!map.has(key)) map.set(key, { id: key, code: code || "-", name: name || "Produto sem descrição", quantity: 0, value: 0, opens: 0, carts: 0, quotes: 0, reserved: 0 });
    return map.get(key);
  }
  events.forEach((event) => {
    const products = event.event === "whatsapp_quote" ? quoteProducts(event) : [productFromEvent(event)];
    products.forEach((product) => {
      const row = get(product);
      if (!row) return;
      if (event.event === "product_open") row.opens += 1;
      if (event.event === "add_to_cart") { const qty = productQuantity(product, event.quantity || 1); row.carts += qty; row.quantity += qty; }
      if (event.event === "whatsapp_quote") { const qty = productQuantity(product, 1); row.quotes += qty; row.quantity += qty; row.value += productValue(product, event); }
    });
  });
  reservations.forEach((reservation) => {
    const row = get({ productCode: reservation.productCode, productName: reservation.product });
    if (!row) return;
    row.reserved += safeNumber(reservation.reservedNumber ?? reservation.reservedQty);
    row.quantity = Math.max(row.quantity, safeNumber(reservation.requestedNumber ?? reservation.requestedQty));
  });
  return [...map.values()].sort((a, b) => b.quotes - a.quotes || b.carts - a.carts || b.opens - a.opens || a.code.localeCompare(b.code, "pt-BR"));
}

export {
  hasCommercialOpportunity,
  commercialEventScore,
  buildCartFollowUpContext,
  updateProductMetric,
  commercialProductRows,
  buildCrmRows,
  buildCartInterestHistory,
  buildOpportunityRows,
  commercialHealth,
  buildActionCenterRows,
  buildDemandStockRows,
  buildAlerts,
  commercialInsightRows,
  buildClientInterestRows
};






