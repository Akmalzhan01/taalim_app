const asyncHandler = require('express-async-handler');
const xml2js = require('xml2js');
const Order = require('../models/Order');

const parseXML = (xmlString) => new Promise((resolve, reject) => {
    xml2js.parseString(xmlString, { explicitArray: false }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
    });
});

const buildResponse = (head, status, msg, errMsg) => {
    const builder = new xml2js.Builder({
        rootName: 'RESPONSE',
        xmldec: { version: '1.0', encoding: 'UTF-8' },
    });
    const body = { STATUS: status, MSG: msg || '' };
    if (errMsg) body.ERR_MSG = errMsg;
    return builder.buildObject({ HEAD: head, BODY: body });
};

const handleMBank = asyncHandler(async (req, res) => {
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');

    let parsed;
    try {
        parsed = await parseXML(req.body);
    } catch {
        return res.send(buildResponse({ DTS: '', QM: '0', QID: '0', OP: '' }, 1, '', 'Invalid XML'));
    }

    const head = parsed?.REQUEST?.HEAD;
    const body = parsed?.REQUEST?.BODY;

    if (!head || !body) {
        return res.send(buildResponse({ DTS: '', QM: '0', QID: '0', OP: '' }, 1, '', 'Bad request structure'));
    }

    const op = head.OP;
    const orderId = body.PARAM1;

    if (op === 'QE10') {
        const order = await Order.findById(orderId).populate('user', 'name');
        if (!order) return res.send(buildResponse(head, 1, '', 'Order not found'));
        if (order.isPaid) return res.send(buildResponse(head, 1, '', 'Order already paid'));

        const name = order.user?.name || 'Покупатель';
        return res.send(buildResponse(head, 0, name));
    }

    if (op === 'QE11') {
        const order = await Order.findById(orderId);
        if (!order) return res.send(buildResponse(head, 1, '', 'Order not found'));
        if (order.isPaid) return res.send(buildResponse(head, 0, 'Already confirmed'));

        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentResult = {
            id: head.QID,
            status: 'COMPLETED',
            update_time: head.DTS,
            email_address: 'mbank',
        };
        await order.save();
        return res.send(buildResponse(head, 0, 'Payment confirmed'));
    }

    if (op === 'PR09') {
        const order = await Order.findById(orderId);
        if (!order) return res.send(buildResponse(head, 1, '', 'Order not found'));
        if (order.isDelivered) return res.send(buildResponse(head, 1, '', 'Order already delivered'));

        order.isPaid = false;
        order.paidAt = undefined;
        order.paymentResult = undefined;
        await order.save();
        return res.send(buildResponse(head, 0, 'Cancelled'));
    }

    return res.send(buildResponse(head, 1, '', 'Unknown operation'));
});

module.exports = { handleMBank };
