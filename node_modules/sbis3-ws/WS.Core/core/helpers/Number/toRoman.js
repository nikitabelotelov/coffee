/// <amd-module name="Core/helpers/Number/toRoman" />
define("Core/helpers/Number/toRoman", ["require", "exports", "Types/formatter", "Env/Env"], function (require, exports, formatter, Env_1) {
    "use strict";
    if (Env_1.IoC.has('ILogger')) {
        Env_1.IoC.resolve('ILogger').warn('Core/helpers/Number/toRoman', 'Модуль устарел и будет удален используйте Types/function:toRoman');
    }
    return formatter.numberRoman;
});
