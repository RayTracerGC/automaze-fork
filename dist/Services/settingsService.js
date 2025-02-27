"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseService_1 = __importDefault(require("./BaseService"));
class SettingsService extends BaseService_1.default {
    constructor(knex) {
        super(knex, 'settings');
    }
}
exports.default = SettingsService;
