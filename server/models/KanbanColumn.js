const mongoose = require('mongoose');

const kanbanColumnSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Пожалуйста, введите название колонки']
    },
    order: {
        type: Number,
        default: 0
    },
    color: {
        type: String,
        default: 'slate'
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    }
}, {
    timestamps: true
});

const KanbanColumn = mongoose.model('KanbanColumn', kanbanColumnSchema);

module.exports = KanbanColumn;
