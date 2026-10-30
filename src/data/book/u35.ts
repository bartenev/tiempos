import type { Chapter } from '../../types'

const chapter: Chapter = {
  unit: 35,
  title: 'Pronombres personales de complemento directo',
  ru: 'Местоимения прямого дополнения: me, te, lo, la, nos, os, los, las',
  tags: ['pronombres', 'personales', 'complementos'],
  sets: [
    {
      task: '35.1 Utilice lo, la, los, las para completar las siguientes frases. — Вставьте lo, la, los, las.',
      rule: 'Прямое дополнение заменяют lo (м. р., ед.), la (ж. р., ед.), los (м. р., мн.), las (ж. р., мн.). Местоимение ставится перед спрягаемым глаголом.',
      items: [
        { kind: 'fill', es: '¿Dónde está Andrés? No ___ veo.', ru: 'Где Андрес? Я его не вижу.', answer: 'lo' },
        { kind: 'fill', es: '¿Dónde están las cucharas? No ___ veo.', ru: 'Где ложки? Я их не вижу.', answer: 'las' },
        { kind: 'fill', es: '¿Dónde están tus amigos? No ___ veo.', ru: 'Где твои друзья? Я их не вижу.', answer: 'los' },
        { kind: 'fill', es: '¿Dónde está el teléfono? No ___ veo.', ru: 'Где телефон? Я его не вижу.', answer: 'lo' },
        { kind: 'fill', es: '¿Dónde está Julia? No ___ veo.', ru: 'Где Хулия? Я её не вижу.', answer: 'la' },
        { kind: 'fill', es: '¿Dónde están tus padres? No ___ veo.', ru: 'Где твои родители? Я их не вижу.', answer: 'los' },
        { kind: 'fill', es: '¿Dónde está la entrada? No ___ veo.', ru: 'Где вход? Я его не вижу.', answer: 'la' },
        { kind: 'fill', es: '¿Dónde están las naranjas? No ___ veo.', ru: 'Где апельсины? Я их не вижу.', answer: 'las' },
      ],
    },
    {
      task: '35.2 Complete con me, te, lo… — Дополните местоимениями me, te, lo…',
      rule: 'Для 1-го и 2-го лица прямое дополнение: me, te, nos, os. Для 3-го лица и вежливых usted/ustedes: lo/la, los/las (по роду и числу того, о ком речь).',
      items: [
        { kind: 'fill', es: 'Yo ___ conozco. Tú eres amigo de Ana.', ru: 'Я тебя знаю. Ты друг Аны.', answer: 'te' },
        { kind: 'fill', es: 'Yo ___ conozco. Ustedes son los padres de Jesús.', ru: 'Я вас знаю. Вы родители Хесуса.', answer: 'los' },
        { kind: 'fill', es: 'Yo ___ conozco. Vosotros sois compañeros de Ramón.', ru: 'Я вас знаю. Вы товарищи Рамона.', answer: 'os' },
        { kind: 'fill', es: 'Yo ___ conozco. Usted es la madre de Rosario.', ru: 'Я вас знаю. Вы мать Росарио.', answer: 'la' },
        { kind: 'fill', es: 'Yo ___ conozco. Ustedes son las tías de Pepe.', ru: 'Я вас знаю. Вы тёти Пепе.', answer: 'las' },
        { kind: 'fill', es: 'Yo ___ conozco. Vosotras sois amigas de Raquel.', ru: 'Я вас знаю. Вы подруги Ракель.', answer: 'os' },
        { kind: 'fill', es: 'Yo ___ conozco. Usted es el padre de Pedro.', ru: 'Я вас знаю. Вы отец Педро.', answer: 'lo' },
        { kind: 'fill', es: 'Yo ___ conozco. Tú vives en la calle Arenal.', ru: 'Я тебя знаю. Ты живёшь на улице Аренал.', answer: 'te' },
      ],
    },
    {
      task: '35.3 Utilice me, te, lo… y las formas verbales correspondientes para completar las respuestas. — Используйте me, te, lo… и нужные формы глагола.',
      rule: 'Местоимение стоит перед глаголом, в том числе перед haber в сложных временах: «no lo he comprado». При отрицании no идёт перед местоимением: «no la quiero».',
      items: [
        { kind: 'fill', es: '—¿Amas a Luis? —Sí, ___.', ru: '— Ты любишь Луиса? — Да, люблю его.', answer: 'lo amo' },
        { kind: 'fill', es: '—¿Quieres esta foto? —No, ___.', ru: '— Хочешь эту фотографию? — Нет, не хочу её.', answer: 'no la quiero' },
        { kind: 'fill', es: '—¿Has comprado el periódico? —No, ___.', ru: '— Ты купил газету? — Нет, не купил.', answer: 'no lo he comprado' },
        { kind: 'fill', es: '—¿Nos quieres, mamá? —Sí, ___ mucho.', ru: '— Ты нас любишь, мама? — Да, очень вас люблю.', answer: 'os quiero' },
        { kind: 'fill', es: '—¿Has visto mis zapatillas? —No, ___.', ru: '— Ты видел мои тапочки? — Нет, не видел.', answer: 'no las he visto' },
        { kind: 'fill', es: '—¿Me recuerdas? —Sí, ___. Tú eres Julián.', ru: '— Ты меня помнишь? — Да, помню. Ты Хулиан.', answer: 'te recuerdo' },
        {
          kind: 'fill',
          es: '—¿Ves mucho a Pepe y a Luisa? —Sí, ___ mucho.',
          ru: '— Ты часто видишься с Пепе и Луисой? — Да, часто их вижу.',
          answer: 'los veo',
        },
        { kind: 'fill', es: '—¿Te quiere Elena? —No, ___.', ru: '— Елена тебя любит? — Нет, не любит.', answer: 'no me quiere' },
        { kind: 'fill', es: '—¿Conoces a los Sres. Pardo? —No, ___.', ru: '— Ты знаешь господ Пардо? — Нет, не знаю.', answer: 'no los conozco' },
        {
          kind: 'fill',
          es: '—¿Te conocen en esta tienda? —Sí, ___ mucho.',
          ru: '— Тебя знают в этом магазине? — Да, хорошо знают.',
          answer: 'me conocen',
        },
      ],
    },
    {
      task: '35.4 Complete las frases con me, te, lo… y a mí, a ti, a él… — Дополните фразы местоимениями me, te, lo… и a mí, a ti, a él…',
      rule: 'Прямое дополнение-человек часто дублируют: «ella no me conoce a mí». Дублирование с a + ударное местоимение (a mí, a nosotros, a ella) усиливает контраст.',
      items: [
        {
          kind: 'fill',
          es: 'Yo conozco a esa chica, pero ella no ___ conoce ___.',
          ru: 'Я знаю эту девушку, но она меня не знает.',
          answer: 'me; a mí',
          answers: ['me', 'a mí'],
        },
        {
          kind: 'fill',
          es: 'Desde aquí vemos a Roberto, pero él no ___ ve ___.',
          ru: 'Отсюда мы видим Роберто, но он нас не видит.',
          answer: 'nos; a nosotros',
          answers: ['nos', 'a nosotros'],
        },
        {
          kind: 'fill',
          es: 'Teresa quiere a Alfredo, pero él no ___ quiere ___.',
          ru: 'Тереса любит Альфредо, но он её не любит.',
          answer: 'la; a ella',
          answers: ['la', 'a ella'],
        },
        {
          kind: 'fill',
          es: 'Esas señoras me conocen, pero yo no ___ conozco ___.',
          ru: 'Эти сеньоры меня знают, но я их не знаю.',
          answer: 'las; a ellas',
          answers: ['las', 'a ellas'],
        },
        {
          kind: 'fill',
          es: 'Ustedes me conocen, pero yo no ___ conozco ___.',
          ru: 'Вы меня знаете, но я вас не знаю.',
          answer: 'los; a ustedes',
          answers: ['los', 'a ustedes'],
        },
        {
          kind: 'fill',
          es: 'Esos chicos conocen a Miguel, pero Miguel no ___ conoce ___.',
          ru: 'Эти ребята знают Мигеля, но Мигель их не знает.',
          answer: 'los; a ellos',
          answers: ['los', 'a ellos'],
        },
      ],
    },
  ],
}

export default chapter
