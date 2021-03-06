define('Core/validHtml', [
   'Core/helpers/Object/find'
], function (objectFind) {
   'use strict';

   // Появилась необходимость вынести это из Core/Sanitize в отдельный файл, чтобы использовать в других модулях
   var
      validNodes = { // Допустимые типы нод
         html: true, head: true, body: true, code: true, // Основные элементы
         p: true, div: true, span: true, img: true, br: true, a: true, pre: true, label: true, // Основные элементы
         b: true, strong: true, i: true, em: true, u: true, s: true, strike: true, q: true, blockquote: true, font: true, // Стили
         h1: true, h2: true, h3: true, h4: true, h5: true, h6: true, // Заголовки
         dd: true, dir: true, dl: true, dt: true, li: true, menu: true, ol: true, ul: true, // Списки
         table: true, thead: true, tbody: true, caption: true, col: true, colgroup: true, td: true, tfoot: true, th: true, tr: true, // Таблицы
         input: true, textarea: true, // инпуты
         iframe: {
            src: function(content, attributeName) {
               var
                  whiteList =  [
                     '//www.youtube.com/embed/'
                  ],
                  srcInWhiteList = objectFind(whiteList, function(url) {
                     return content.attributes[attributeName].value.indexOf(url) >= 0;
                  });

               if (!srcInWhiteList) {
                  delete content.attributes[attributeName];
               }
            },
            frameborder: true,
            allowfullscreen: true
         }
      },

      validAttributes = { // Допустимые атрибуты
         style: true,
         src: true,
         height: true,
         width: true,
         colspan: true,
         rowspan: true,
         'class': true,
         id: true,
         tabindex: true,
         title: true,
         href: true,
         target: true,
         rel: true, // Для ссылок важно иметь атрибут rel="noopener noreferrer"
         alt: true,
         hasmarkup: true,
         config: true,
         cellpadding: true,
         cellspacing: true,
         border: true,
         align: true,
         bgcolor: true,
         name: true
      },

      fullEscapeNodes = { // Типы нод, которые нужно экранировать полностью, вместе с содержимым.
         script: true,    // Если ноды нет в этом списке, в текст превращаются только открывающие и закрывающие теги,
         style: true      // а содержимое остается тегами и также проходит проверку на валидность
      };

   return {
      validNodes: validNodes,
      validAttributes: validAttributes,
      fullEscapeNodes: fullEscapeNodes,
      checkDataAttribute: true,
      escapeInvalidTags: true // не вырезать неразрешенные теги, а экранировать и превращать в текст
   };
});