import type { Chapter } from '../../types'

const chapter: Chapter = {
  unit: 39,
  title: 'Pronombres de complemento con el imperativo, el infinitivo y el gerundio',
  ru: 'Местоимения с императивом, инфинитивом и герундием: ámalo, comprarlo, dándomelo',
  tags: ['pronombres', 'personales', 'complementos', 'imperativo'],
  sets: [
    {
      id: '39.1',
      task: '39.1 Sustituya las palabras subrayadas por pronombres y haga los cambios necesarios. — Замените слова местоимениями и внесите нужные изменения.',
      rule: 'С утвердительным императивом местоимение пишется слитно в конце: ámalos, dáselo. Слово может получить ударение (pásasela). Le/les перед lo/la… → se.',
      items: [
        { kind: 'rewrite', es: 'Ama a tus padres.', ru: 'Люби своих родителей.', answers: ['Ámalos'] },
        { kind: 'rewrite', es: 'Comprad el periódico.', ru: 'Купите газету.', answers: ['Compradlo'] },
        { kind: 'rewrite', es: 'Dale su dinero a Elvira.', ru: 'Отдай Эльвире её деньги.', answers: ['Dáselo'] },
        { kind: 'rewrite', es: 'Hazle la pregunta a Carlos.', ru: 'Задай вопрос Карлосу.', answers: ['Házsela'] },
        { kind: 'rewrite', es: 'Pregunta a tu madre.', ru: 'Спроси свою маму.', answers: ['Pregúntale'] },
        { kind: 'rewrite', es: 'Venda la casa.', ru: 'Продайте дом.', answers: ['Véndala'] },
        { kind: 'rewrite', es: 'Pasa el agua a Ramón.', ru: 'Передай воду Рамону.', answers: ['Pásasela'] },
        { kind: 'rewrite', es: 'Escribe a Sheila.', ru: 'Напиши Шейле.', answers: ['Escríbele'] },
      ],
    },
    {
      id: '39.2',
      task: '39.2 Complete las frases con los infinitivos del recuadro y los pronombres adecuados. — Дополните фразы инфинитивами из рамки и подходящими местоимениями.',
      rule: 'С инфинитивом местоимение присоединяется в конце: comprarlo, devolvérmelo. При двух местоимениях порядок тот же: косвенное + прямое (vendérselo).',
      bank: 'ayudar · comprar · devolver · escribir · preguntar · tirar · vender · ver · visitar',
      items: [
        {
          kind: 'fill',
          es: '¿Has comprado el periódico? —He olvidado ___.',
          ru: '— Ты купил газету? — Я забыл её купить.',
          blanks: [['comprarlo']],
        },
        {
          kind: 'fill',
          es: 'Ese libro es mío, pero Carlos no quiere ___.',
          ru: 'Эта книга моя, но Карлос не хочет мне её вернуть.',
          blanks: [['devolvérmelo']],
        },
        {
          kind: 'fill',
          es: 'Sonia está enfadada con vosotros. No quiere ___.',
          ru: 'Сония сердится на вас. Она не хочет вас видеть.',
          blanks: [['veros']],
        },
        {
          kind: 'fill',
          es: 'Estos zapatos están muy viejos. Voy a ___.',
          ru: 'Эти туфли очень старые. Я их выброшу.',
          blanks: [['tirarlos']],
        },
        {
          kind: 'fill',
          es: 'Ven aquí, Gabriel. Quiero ___ algo.',
          ru: 'Иди сюда, Габриэль. Я хочу тебя кое о чём спросить.',
          blanks: [['preguntarte']],
        },
        {
          kind: 'fill',
          es: 'Ramón quiere comprarme ese cuadro, pero yo no quiero ___.',
          ru: 'Рамон хочет купить у меня эту картину, но я не хочу её ему продавать.',
          blanks: [['vendérselo']],
        },
        {
          kind: 'fill',
          es: 'He tenido carta de Antón. Tengo que ___.',
          ru: 'Я получил письмо от Антона. Я должен ему написать.',
          blanks: [['escribirle']],
        },
        {
          kind: 'fill',
          es: 'No sabemos hacer el ejercicio, pero Hans quiere ___.',
          ru: 'Мы не умеем делать упражнение, но Ханс хочет нам помочь.',
          blanks: [['ayudarnos']],
        },
        {
          kind: 'fill',
          es: 'Mis tías viven en este barrio. Me gustaría ___.',
          ru: 'Мои тёти живут в этом районе. Мне хотелось бы их навестить.',
          blanks: [['visitarlas']],
        },
      ],
    },
    {
      id: '39.3',
      task: '39.3 Sustituya las palabras subrayadas por pronombres y haga los cambios necesarios. — Замените слова местоимениями и внесите нужные изменения.',
      rule: 'С герундием местоимение тоже присоединяется в конце, и нужно письменное ударение: limpiándolas, preguntándole, lavándoselo. Можно и перед estar («las está limpiando»), но здесь — слитно.',
      items: [
        { kind: 'rewrite', es: 'Está limpiando las ventanas.', ru: 'Она моет окна.', answers: ['Está limpiándolas'] },
        { kind: 'rewrite', es: 'Estoy acabando la novela.', ru: 'Я заканчиваю роман.', answers: ['Estoy acabándola'] },
        {
          kind: 'rewrite',
          es: 'Están preguntando al Sr. Oliva.',
          ru: 'Они спрашивают сеньора Оливу.',
          answers: ['Están preguntándole'],
        },
        {
          kind: 'rewrite',
          es: 'Estamos lavando las camisas.',
          ru: 'Мы стираем рубашки.',
          answers: ['Estamos lavándolas'],
        },
        {
          kind: 'rewrite',
          es: 'Están haciendo la pregunta a Carla.',
          ru: 'Они задают вопрос Карле.',
          answers: ['Están haciéndosela'],
        },
        {
          kind: 'rewrite',
          es: 'Está lavando el pelo a su hijo.',
          ru: 'Она моет сыну голову.',
          answers: ['Está lavándoselo'],
        },
        { kind: 'rewrite', es: 'Está hablando a Pepa.', ru: 'Он говорит с Пепой.', answers: ['Está hablándole'] },
        { kind: 'rewrite', es: 'Está arreglando la radio.', ru: 'Он чинит радио.', answers: ['Está arreglándola'] },
      ],
    },
    {
      id: '39.4',
      task: '39.4 Ordene las palabras y ponga las tildes necesarias. — Расставьте слова по порядку и поставьте ударения.',
      rule: 'Местоимение присоединяется к утвердительному императиву, инфинитиву и герундию, а с обычным спрягаемым глаголом стоит перед ним. С модальным глаголом возможны оба варианта: «quiere vernos» / «nos quiere ver».',
      items: [
        { kind: 'rewrite', es: 'la sal / me / pasa', ru: 'Передай мне соль.', answers: ['Pásame la sal'] },
        {
          kind: 'rewrite',
          es: 'la directora / nos / ver / quiere',
          ru: 'Директор хочет нас видеть.',
          answers: ['La directora quiere vernos', 'La directora nos quiere ver'],
        },
        {
          kind: 'rewrite',
          es: 'no tengo pan. He olvidado / lo / comprar',
          ru: 'У меня нет хлеба. Я забыл его купить.',
          answers: ['He olvidado comprarlo'],
        },
        {
          kind: 'rewrite',
          es: '¿me / ayudar / puedes?',
          ru: 'Ты можешь мне помочь?',
          answers: ['¿Puedes ayudarme?', '¿Me puedes ayudar?'],
        },
        {
          kind: 'rewrite',
          es: 'a Julio / se / pregunta / lo',
          ru: 'Спроси об этом Хулио.',
          answers: ['Pregúntaselo a Julio'],
        },
        {
          kind: 'rewrite',
          es: '¿quién / lo / está haciendo?',
          ru: 'Кто это делает?',
          answers: ['¿Quién está haciéndolo?', '¿Quién lo está haciendo?'],
        },
        {
          kind: 'rewrite',
          es: 'me gustaría / a Sandra / lo / se / decir',
          ru: 'Мне хотелось бы сказать это Сандре.',
          answers: ['Me gustaría decírselo a Sandra'],
        },
        { kind: 'rewrite', es: 'me / la pelota / pasa', ru: 'Передай мне мяч.', answers: ['Pásame la pelota'] },
      ],
    },
  ],
}

export default chapter
