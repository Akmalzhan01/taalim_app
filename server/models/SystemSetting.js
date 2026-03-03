const mongoose = require('mongoose');

const systemSettingSchema = mongoose.Schema({
    receiptSettings: {
        printerSize: { type: String, default: '80mm', enum: ['80mm', '58mm', 'A4'] },
        headerText: { type: String, default: 'Taalim Kitob Olami' },
        footerText: { type: String, default: 'Xaridingiz uchun rahmat!' },
        showLogo: { type: Boolean, default: true },
        showCashbackInfo: { type: Boolean, default: true },
        showBarcode: { type: Boolean, default: true }
    },
    barcodePrinterSettings: {
        printerSize: { type: String, default: 'A4', enum: ['A4', 'Thermal'] }
    }
}, {
    timestamps: true,
});

const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);

module.exports = SystemSetting;
