define('Transport/Record', [
   'Deprecated/Record',
   'Core/deprecated'
], function(Record, deprecated) {
   deprecated.showInfoLog('Transport/Record помечен как deprecated и будет удален в 3.18. Используйте Types/entity:Record.');
   return Record;
});
