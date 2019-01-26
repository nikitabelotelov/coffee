define('Transport/RecordSet',[
   'Deprecated/RecordSet',
   'Core/deprecated'
], function(RecordSet, deprecated) {
   deprecated.showInfoLog('Transport/RecordSet помечен как deprecated и будет удален в 3.18. Используйте Types/collection:RecordSet.');
   return RecordSet;
});
