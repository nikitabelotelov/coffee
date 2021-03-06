/// <amd-module name="Types/_source/ICrud" />
/**
 * Интерфейс источника данных, поддерживающиего контракт
 * {link https://en.wikipedia.org/wiki/Create,_read,_update_and_delete CRUD}, применяемый к объекту предметной области.
 *
 * Создадим новую статью:
 * <pre>
 *    var dataSource = new CrudSource();
 *    dataSource.create().addCallbacks(function(article) {
 *       console.log(article.getId());
 *    }, function(error) {
 *       console.error(error);
 *    });
 * </pre>
 * Прочитаем статью:
 * <pre>
 *    var dataSource = new CrudSource();
 *    dataSource.read('article-1').addCallbacks(function(article) {
 *       console.log(article.get('title'));
 *    }, function(error) {
 *       console.error(error);
 *    });
 * </pre>
 * Сохраним статью:
 * <pre>
 *    var dataSource = new CrudSource(),
 *       article = new Record({
 *          rawData: {
 *             id: 'article-1',
 *             title: 'Article 1'
 *          }
 *       });
 *
 *    dataSource.update(article).addCallbacks(function() {
 *       console.log('Article updated!');
 *    }, function(error) {
 *       console.error(error);
 *    });
 * </pre>
 * Удалим статью:
 * <pre>
 *    var dataSource = new CrudSource();
 *    dataSource.destroy('article-1').addCallbacks(function(article) {
 *       console.log('Article deleted!');
 *    }, function(error) {
 *       console.error(error);
 *    });
 * </pre>
 * @interface Types/_source/ICrud
 * @public
 * @author Мальцев А.А.
 */
define('Types/_source/ICrud', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
});