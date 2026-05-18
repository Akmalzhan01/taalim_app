const asyncHandler = require('express-async-handler');
const xml2js = require('xml2js');
const Order = require('../models/Order');

const parseXML = (xmlString) => new Promise((resolve, reject) => {
    xml2js.parseString(xmlString, { explicitArray: false }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
    });
});

const buildResponse = (headAttrs, status, msg, errMsg) => {
    const builder = new xml2js.Builder({
        rootName: 'RESPONSE',
        xmldec: { version: '1.0', encoding: 'UTF-8' },
    });
    const bodyAttrs = { STATUS: status, MSG: msg || '' };
    if (errMsg) bodyAttrs.ERR_MSG = errMsg;
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
        return res.send(buildResponse({ DTS: '', QM: '0', QID: '0', OP: '' }, 1, '', 'Invalid XML'));
    }

    // MBank sends <XML><HEAD .../><BODY .../></XML>
    const root = parsed?.XML || parsed?.REQUEST;
    const headEl = root?.HEAD;
    const bodyEl = root?.BODY;

    if (!headEl || !bodyEl) {
        return res.send(buildResponse({ DTS: '', QM: '0', QID: '0', OP: '' }, 1, '', 'Bad request structure'));
    }

    // Attributes come under '$' key with xml2js
    const headAttrs = headEl.$ || headEl;
    const bodyAttrs = bodyEl.$ || bodyEl;

    const op = headAttrs.OP;
    const orderId = bodyAttrs.PARAM1;

    if (op === 'QE10') {
        const order = await Order.findById(orderId).populate('user', 'name');
        if (!order) return res.send(buildResponse(headAttrs, 1, '', 'Order not found'));
        if (order.isPaid) return res.send(buildResponse(headAttrs, 1, '', 'Order already paid'));

        const name = order.user?.name || 'Покупатель';
        return res.send(buildResponse(headAttrs, 0, name));
    }

    if (op === 'QE11') {
        const order = await Order.findById(orderId);
        if (!order) return res.send(buildResponse(headAttrs, 1, '', 'Order not found'));
        if (order.isPaid) return res.send(buildResponse(headAttrs, 0, 'Already confirmed'));

        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentResult = {
            id: headAttrs.QID,
            status: 'COMPLETED',
            update_time: headAttrs.DTS,
            email_address: 'mbank',
        };
        await order.save();
        return res.send(buildResponse(headAttrs, 0, 'Payment confirmed'));
    }

    if (op === 'PR09') {
        const order = await Order.findById(orderId);
        if (!order) return res.send(buildResponse(headAttrs, 1, '', 'Order not found'));
        if (order.isDelivered) return res.send(buildResponse(headAttrs, 1, '', 'Order already delivered'));

        order.isPaid = false;
        order.paidAt = undefined;
        order.paymentResult = undefined;
        await order.save();
        return res.send(buildResponse(headAttrs, 0, 'Cancelled'));
    }

    return res.send(buildResponse(headAttrs, 1, '', 'Unknown operation'));
});

module.exports = { handleMBank };
