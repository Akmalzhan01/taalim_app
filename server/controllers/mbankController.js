const asyncHandler = require('express-async-handler');
const xml2js = require('xml2js');
const Order = require('../models/Order');

const parseXML = (xmlString) => new Promise((resolve, reject) => {
    xml2js.parseString(xmlString, { explicitArray: false }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
    });
});

const buildResponse = (headAttrs, bodyAttrs) => {
    const builder = new xml2js.Builder({
        rootName: 'XML',
        xmldec: { version: '1.0', encoding: 'utf-8' },
    });
    return builder.buildObject({
        HEAD: { $: headAttrs },
        BODY: { $: bodyAttrs },
    });
};

const handleMBank = asyncHandler(async (req, res) => {
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');

    let parsed;
    try {
        parsed = await parseXML(req.body);
    } catch {
        return res.send(buildResponse(
            { DTS: '', QM: '', QID: '', OP: '' },
            { STATUS: 401, ERR_MSG: 'Неправильный формат запроса' }
        ));
    }

    const root = parsed?.XML || parsed?.REQUEST;
    const headEl = root?.HEAD;
    const bodyEl = root?.BODY;

    if (!headEl || !bodyEl) {
        return res.send(buildResponse(
            { DTS: '', QM: '', QID: '', OP: '' },
            { STATUS: 401, ERR_MSG: 'Неправильный формат запроса' }
        ));
    }

    const headAttrs = headEl.$ || headEl;
    const bodyAttrs = bodyEl.$ || bodyEl;
    const op = headAttrs.OP;
    const orderId = bodyAttrs.PARAM1;
    const serviceId = bodyAttrs.SERVICE_ID;

    if (serviceId !== '789') {
        return res.send(buildResponse(headAttrs, { STATUS: 401, ERR_MSG: 'Неправильный формат запроса' }));
    }

    // QE11 = Проверка платежа (pre-payment check)
    if (op === 'QE11') {
        const order = await Order.findById(orderId);
        if (!order) return res.send(buildResponse(headAttrs, { STATUS: 420, ERR_MSG: 'Лицевой счет не найден' }));
        if (order.isPaid) return res.send(buildResponse(headAttrs, { STATUS: 421, ERR_MSG: 'Дублирование платежа' }));
        return res.send(buildResponse(headAttrs, { STATUS: 200 }));
    }

    // QE10 = Проведение платежа (payment execution)
    if (op === 'QE10') {
        const order = await Order.findById(orderId);
        if (!order) return res.send(buildResponse(headAttrs, { STATUS: 420, ERR_MSG: 'Лицевой счет не найден' }));

        if (order.isPaid) {
            // Same QID = idempotent (repeat request)
            if (order.paymentResult?.id === headAttrs.QID) {
                return res.send(buildResponse(headAttrs, { STATUS: 250, MSG: 'Платеж проведен' }));
            }
            // Different QID = duplicate payment attempt
            return res.send(buildResponse(headAttrs, { STATUS: 421, ERR_MSG: 'Дублирование платежа' }));
        }

        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentResult = {
            id: headAttrs.QID,
            status: 'COMPLETED',
            update_time: headAttrs.DTS,
            email_address: 'mbank',
        };
        await order.save();
        return res.send(buildResponse(headAttrs, { STATUS: 250, MSG: 'Платеж проведен' }));
    }

    // PR09 = Отмена платежа (cancel payment)
    if (op === 'PR09') {
        const order = await Order.findById(orderId);
        if (!order) return res.send(buildResponse(headAttrs, { STATUS: 420, ERR_MSG: 'Лицевой счет не найден' }));
        if (order.isDelivered) return res.send(buildResponse(headAttrs, { STATUS: 420, ERR_MSG: 'Отмена невозможна, заказ уже доставлен' }));

        order.isPaid = false;
        order.paidAt = undefined;
        order.paymentResult = undefined;
        await order.save();
        return res.send(buildResponse(headAttrs, { STATUS: 250, ERR_MSG: 'Платеж успешно отменен' }));
    }

    return res.send(buildResponse(headAttrs, { STATUS: 401, ERR_MSG: 'Неправильный формат запроса' }));
});

module.exports = { handleMBank };
