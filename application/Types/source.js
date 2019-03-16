/// <amd-module name="Types/source" />
/**
 * Data sources library
 * @library Types/source
 * @includes Base Types/_source/Base
 * @includes DataSet Types/_source/DataSet
 * @includes HierarchicalMemory Types/_source/HierarchicalMemory
 * @includes ICrud Types/_source/ICrud
 * @includes ICrudPlus Types/_source/ICrudPlus
 * @includes IData Types/_source/IData
 * @includes IProvider Types/_source/IProvider
 * @includes IRpc Types/_source/IRpc
 * @includes Local Types/_source/Local
 * @includes Memory Types/_source/Memory
 * @includes PrefetchProxy Types/_source/PrefetchProxy
 * @includes Query Types/_source/Query
 * @includes Remote Types/_source/Remote
 * @includes Rpc Types/_source/Rpc
 * @includes SbisService Types/_source/SbisService
 * @author Мальцев А.А.
 */
define('Types/source', [
    'require',
    'exports',
    'Types/_source/Base',
    'Types/_source/DataSet',
    'Types/_source/HierarchicalMemory',
    'Types/_source/ICrud',
    'Types/_source/ICrudPlus',
    'Types/_source/IData',
    'Types/_source/IProvider',
    'Types/_source/IRpc',
    'Types/_source/Local',
    'Types/_source/Memory',
    'Types/_source/PrefetchProxy',
    'Types/_source/provider',
    'Types/_source/Query',
    'Types/_source/Remote',
    'Types/_source/Rpc',
    'Types/_source/SbisService',
    'Types/_source/Query',
    'Types/_source/SbisService'
], function (require, exports, Base_1, DataSet_1, HierarchicalMemory_1, ICrud_1, ICrudPlus_1, IData_1, IProvider_1, IRpc_1, Local_1, Memory_1, PrefetchProxy_1, provider, Query_1, Remote_1, Rpc_1, SbisService_1, QueryExt, SbisServiceExt) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.Base = Base_1.default;
    exports.DataSet = DataSet_1.default;
    exports.HierarchicalMemory = HierarchicalMemory_1.default;
    exports.ICrud = ICrud_1.default;
    exports.ICrudPlus = ICrudPlus_1.default;
    exports.IData = IData_1.default;
    exports.IProvider = IProvider_1.default;
    exports.IRpc = IRpc_1.default;
    exports.Local = Local_1.default;
    exports.Memory = Memory_1.default;
    exports.PrefetchProxy = PrefetchProxy_1.default;
    exports.provider = provider;
    exports.Query = Query_1.default;
    exports.QueryExpandMode = Query_1.ExpandMode;
    exports.IQueryMeta = Query_1.IMeta;
    exports.Remote = Remote_1.default;
    exports.Rpc = Rpc_1.default;
    exports.SbisService = SbisService_1.default;
    exports.QueryExt = QueryExt;
    exports.SbisServiceExt = SbisServiceExt;
});