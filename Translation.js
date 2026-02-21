// models/Translation.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Translation = sequelize.define('Translation', {
    translation_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    language_code: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    content_key: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    translated_text: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'translations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['language_code', 'content_key']
        }
    ]
});

module.exports = Translation;