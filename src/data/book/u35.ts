import type { Chapter } from '../../types'

const chapter: Chapter = {
  unit: 35,
  title: 'Pronombres personales de complemento directo',
  ru: 'Местоимения прямого дополнения: me, te, lo, la, nos, os, los, las',
  tags: ['pronombres', 'personales', 'complementos'],
  sets: [
    {
      id: '35.1',
      task: '35.1 Utilice lo, la, los, las para completar las siguientes frases. — Вставьте lo, la, los, las.',
      rule: 'Прямое дополнение заменяют lo (м. р., ед.), la (ж. р., ед.), los (м. р., мн.), las (ж. р., мн.). Местоимение ставится перед спрягаемым глаголом.',
      items: [
        { kind: 'fill', es: '¿Dónde está Andrés? No ___ veo.', ru: 'Где Андрес? Я его не вижу.', blanks: [['lo']] },
        {
          kind: 'fill',
          es: '¿Dónde están las cucharas? No ___ veo.',
          ru: 'Где ложки? Я их не вижу.',
          blanks: [['las']],
        },
        {
          kind: 'fill',
          es: '¿Dónde están tus amigos? No ___ veo.',
          ru: 'Где твои друзья? Я их не вижу.',
          blanks: [['los']],
        },
        {
          kind: 'fill',
          es: '¿Dónde está el teléfono? No ___ veo.',
          ru: 'Где телефон? Я его не вижу.',
          blanks: [['lo']],
        },
        { kind: 'fill', es: '¿Dónde está Julia? No ___ veo.', ru: 'Где Хулия? Я её не вижу.', blanks: [['la']] },
        {
          kind: 'fill',
          es: '¿Dónde están tus padres? No ___ veo.',
          ru: 'Где твои родители? Я их не вижу.',
          blanks: [['los']],
        },
        { kind: 'fill', es: '¿Dónde está la entrada? No ___ veo.', ru: 'Где вход? Я его не вижу.', blanks: [['la']] },
        {
          kind: 'fill',
          es: '¿Dónde están las naranjas? No ___ veo.',
          ru: 'Где апельсины? Я их не вижу.',
          blanks: [['las']],
        },
      ],
    },
    {
      id: '35.2',
      task: '35.2 Complete con me, te, lo… — Дополните местоимениями me, te, lo…',
      rule: 'Для 1-го и 2-го лица прямое дополнение: me, te, nos, os. Для 3-го лица и вежливых usted/ustedes: lo/la, los/las (по роду и числу того, о ком речь).',
      items: [
        {
          kind: 'fill',
          es: 'Yo ___ conozco. Tú eres amigo de Ana.',
          ru: 'Я тебя знаю. Ты друг Аны.',
          blanks: [['te']],
        },
        {
          kind: 'fill',
          es: 'Yo ___ conozco. Ustedes son los padres de Jesús.',
          ru: 'Я вас знаю. Вы родители Хесуса.',
          blanks: [['los']],
        },
        {
          kind: 'fill',
          es: 'Yo ___ conozco. Vosotros sois compañeros de Ramón.',
          ru: 'Я вас знаю. Вы товарищи Рамона.',
          blanks: [['os']],
        },
        {
          kind: 'fill',
          es: 'Yo ___ conozco. Usted es la madre de Rosario.',
          ru: 'Я вас знаю. Вы мать Росарио.',
          blanks: [['la']],
        },
        {
          kind: 'fill',
          es: 'Yo ___ conozco. Ustedes son las tías de Pepe.',
          ru: 'Я вас знаю. Вы тёти Пепе.',
          blanks: [['las']],
        },
        {
          kind: 'fill',
          es: 'Yo ___ conozco. Vosotras sois amigas de Raquel.',
          ru: 'Я вас знаю. Вы подруги Ракель.',
          blanks: [['os']],
        },
        {
          kind: 'fill',
          es: 'Yo ___ conozco. Usted es el padre de Pedro.',
          ru: 'Я вас знаю. Вы отец Педро.',
          blanks: [['lo']],
        },
        {
          kind: 'fill',
          es: 'Yo ___ conozco. Tú vives en la calle Arenal.',
          ru: 'Я тебя знаю. Ты живёшь на улице Аренал.',
          blanks: [['te']],
        },
      ],
    },
    {
      id: '35.3',
      task: '35.3 Utilice me, te, lo… y las formas verbales correspondientes para completar las respuestas. — Используйте me, te, lo… и нужные формы глагола.',
      rule: 'Местоимение стоит перед глаголом, в том числе перед haber в сложных временах: «no lo he comprado». При отрицании no идёт перед местоимением: «no la quiero».',
      items: [
        {
          kind: 'fill',
          es: '—¿Amas a Luis? —Sí, ___.',
          ru: '— Ты любишь Луиса? — Да, люблю его.',
          blanks: [['lo amo']],
        },
        {
          kind: 'fill',
          es: '—¿Quieres esta foto? —No, ___.',
          ru: '— Хочешь эту фотографию? — Нет, не хочу её.',
          blanks: [['no la quiero']],
        },
        {
          kind: 'fill',
          es: '—¿Has comprado el periódico? —No, ___.',
          ru: '— Ты купил газету? — Нет, не купил.',
          blanks: [['no lo he comprado']],
        },
        {
          kind: 'fill',
          es: '—¿Nos quieres, mamá? —Sí, ___ mucho.',
          ru: '— Ты нас любишь, мама? — Да, очень вас люблю.',
          blanks: [['os quiero']],
        },
        {
          kind: 'fill',
          es: '—¿Has visto mis zapatillas? —No, ___.',
          ru: '— Ты видел мои тапочки? — Нет, не видел.',
          blanks: [['no las he visto']],
        },
        {
          kind: 'fill',
          es: '—¿Me recuerdas? —Sí, ___. Tú eres Julián.',
          ru: '— Ты меня помнишь? — Да, помню. Ты Хулиан.',
          blanks: [['te recuerdo']],
        },
        {
          kind: 'fill',
          es: '—¿Ves mucho a Pepe y a Luisa? —Sí, ___ mucho.',
          ru: '— Ты часто видишься с Пепе и Луисой? — Да, часто их вижу.',
          blanks: [['los veo']],
        },
        {
          kind: 'fill',
          es: '—¿Te quiere Elena? —No, ___.',
          ru: '— Елена тебя любит? — Нет, не любит.',
          blanks: [['no me quiere']],
        },
        {
          kind: 'fill',
          es: '—¿Conoces a los Sres. Pardo? —No, ___.',
          ru: '— Ты знаешь господ Пардо? — Нет, не знаю.',
          blanks: [['no los conozco']],
        },
        {
          kind: 'fill',
          es: '—¿Te conocen en esta tienda? —Sí, ___ mucho.',
          ru: '— Тебя знают в этом магазине? — Да, хорошо знают.',
          blanks: [['me conocen']],
        },
      ],
    },
    {
      id: '35.4',
      task: '35.4 Complete las frases con me, te, lo… y a mí, a ti, a él… — Дополните фразы местоимениями me, te, lo… и a mí, a ti, a él…',
      rule: 'Прямое дополнение-человек часто дублируют: «ella no me conoce a mí». Дублирование с a + ударное местоимение (a mí, a nosotros, a ella) усиливает контраст.',
      items: [
        {
          kind: 'fill',
          es: 'Yo conozco a esa chica, pero ella no ___ conoce ___.',
          ru: 'Я знаю эту девушку, но она меня не знает.',
          blanks: [['me'], ['a mí']],
        },
        {
          kind: 'fill',
          es: 'Desde aquí vemos a Roberto, pero él no ___ ve ___.',
          ru: 'Отсюда мы видим Роберто, но он нас не видит.',
          blanks: [['nos'], ['a nosotros']],
        },
        {
          kind: 'fill',
          es: 'Teresa quiere a Alfredo, pero él no ___ quiere ___.',
          ru: 'Тереса любит Альфредо, но он её не любит.',
          blanks: [['la'], ['a ella']],
        },
        {
          kind: 'fill',
          es: 'Esas señoras me conocen, pero yo no ___ conozco ___.',
          ru: 'Эти сеньоры меня знают, но я их не знаю.',
          blanks: [['las'], ['a ellas']],
        },
        {
          kind: 'fill',
          es: 'Ustedes me conocen, pero yo no ___ conozco ___.',
          ru: 'Вы меня знаете, но я вас не знаю.',
          blanks: [['los'], ['a ustedes']],
        },
        {
          kind: 'fill',
          es: 'Esos chicos conocen a Miguel, pero Miguel no ___ conoce ___.',
          ru: 'Эти ребята знают Мигеля, но Мигель их не знает.',
          blanks: [['los'], ['a ellos']],
        },
      ],
    },
  ],
}

export default chapter
