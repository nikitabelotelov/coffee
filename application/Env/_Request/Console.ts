/// <amd-module name='Env/_Request/Console' />
/* tslint:disable:no-console */
/* eslint-disable no-console */
import { IConsole } from 'Env/_Request/Interface/IConsole';
// @ts-ignore
import constants = require('Core/constants');

const isAllowedLog = (allowedLevel: LogLevel, methodLevel: LogLevel) => allowedLevel > methodLevel;
const checkConsoleMethod = (console, method: string) => console && (typeof console[method] === 'function');

export enum LogLevel {
    info = 0,
    warning = 1,
    error = 2
}
type ConsoleConfig = {
    logLevel: LogLevel,
    console
}
export class Console implements IConsole {
    private __logLevel: LogLevel;
    private __console;
    constructor({ logLevel, console }: ConsoleConfig) {
        this.__logLevel = <LogLevel>(logLevel || constants.logLevel);
        this.__console = console;
    }
    setLogLevel(mode: LogLevel) {
        this.__logLevel = mode;
    };
    getLogLevel(): LogLevel {
        return this.__logLevel;
    };

    info() {
        if (isAllowedLog(this.__logLevel, LogLevel.info) && checkConsoleMethod(this.__console, 'info')) {
            console.info(arguments); // eslint-disable-line no-console
        }
    };

    log() {
        if (isAllowedLog(this.__logLevel, LogLevel.info) && checkConsoleMethod(this.__console, 'log')) {
            console.log(arguments); // eslint-disable-line no-console
        }
    };

    warning() {
        if (!isAllowedLog(this.__logLevel, LogLevel.warning)) {
            return;
        }
        if (checkConsoleMethod(this.__console, 'error')) {
            return console.warn(arguments) // eslint-disable-line no-console
        }
        if (checkConsoleMethod(this.__console, 'log')) {
            return console.log(arguments) // eslint-disable-line no-console
        }
    };

    error() {
        if (!isAllowedLog(this.__logLevel, LogLevel.error) || !checkConsoleMethod(this.__console, 'error')) {
            return;
        }
        console.error(arguments); // eslint-disable-line no-console
    };
}
