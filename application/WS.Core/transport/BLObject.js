define('Transport/BLObject', [
   'Deprecated/BLObject',
   'Core/deprecated'
], function(BLObject, deprecated) {
   deprecated.showInfoLog('Transport/BLObject помечен как deprecated и будет удален в 3.18. Используйте Types/source:SbisService.');
   return BLObject;
});
