import type { Chapter } from '../../types'

const chapter: Chapter = {
  unit: 122,
  title: 'Oraciones impersonales',
  ru: 'Безличные предложения: se vive mejor, uno se divierte, es fácil equivocarse, hace frío',
  tags: ['pronombres', 'impersonales'],
  sets: [
    {
      id: '122.1',
      task: 'Complete las frases con los verbos del recuadro y se o uno. — Дополните предложения глаголами из рамки и se или uno.',
      rule: 'Обобщённо-личное значение («люди вообще») выражается конструкцией se + глагол в 3-м лице (se vive mejor, se necesita menos dinero) либо uno + возвратный глагол (uno se relaciona, se siente uno). Для возвратных глаголов se уже занят, поэтому добавляется uno: se divierte uno, uno se siente.',
      bank: 'necesitar, relacionarse, tener, vivir, vivir / divertirse, sentirse, tener, vivir, vivir',
      items: [
        {
          kind: 'fill',
          es: 'En un pueblo pequeño ___ mejor. ___ más tranquilo, ___ más tiempo libre, ___ más con la gente y ___ menos dinero.',
          ru: 'В маленьком городке живётся лучше. Живётся спокойнее, есть больше свободного времени, больше общаешься с людьми и нужно меньше денег.',
          blanks: [['se vive'], ['Se vive'], ['se tiene'], ['uno se relaciona', 'se relaciona uno'], ['se necesita']],
          prompt: 'necesitar, relacionarse, tener, vivir, vivir',
        },
        {
          kind: 'fill',
          es: 'En una gran ciudad ___ más libertad y ___ más, aunque a veces ___ solo. Antes ___ mejor en las ciudades, pero ahora ___ bien en todas partes.',
          ru: 'В большом городе больше свободы и больше развлечений, хотя иногда чувствуешь себя одиноко. Раньше в городах жилось лучше, но сейчас везде живётся хорошо.',
          blanks: [['se tiene'], ['se divierte uno', 'uno se divierte'], ['se siente uno', 'uno se siente'], ['se vivía'], ['se vive']],
          prompt: 'divertirse, sentirse, tener, vivir, vivir',
        },
      ],
    },
    {
      id: '122.2',
      task: 'Vuelva a escribir las frases comenzando con alguna de las expresiones del recuadro. — Перепишите предложения, начав с одного из выражений в рамке.',
      rule: 'Se + глагол в 3-м лице заменяет неопределённо-личные обороты: se dice que (говорят, что), se sospechaba que, se supone que, se espera que, se puede + инфинитив, se suele + инфинитив, se necesita + инфинитив. Глагол согласуется в числе только с существительным: se necesitan camareros, но se necesita ser alto.',
      bank: 'se dice, se espera, se necesita, se puede, se sospechaba, se suele, se supone, (se veía)',
      items: [
        {
          kind: 'rewrite',
          es: 'Estaba claro que Olga estaba contenta.',
          ru: 'Было ясно, что Ольга довольна. → Было видно, что Ольга довольна.',
          answers: ['Se veía que Olga estaba contenta'],
        },
        {
          kind: 'rewrite',
          es: 'En Chile es costumbre bailar la cueca en las fiestas populares.',
          ru: 'В Чили принято танцевать куэку на народных праздниках.',
          answers: ['En Chile se suele bailar la cueca en las fiestas populares'],
        },
        {
          kind: 'rewrite',
          es: 'Alguien dice que Norma no se encuentra bien.',
          ru: 'Кто-то говорит, что Норма плохо себя чувствует.',
          answers: ['Se dice que Norma no se encuentra bien'],
        },
        {
          kind: 'rewrite',
          es: 'Es posible hablar por teléfono desde aquí.',
          ru: 'Отсюда можно позвонить по телефону.',
          answers: ['Se puede hablar por teléfono desde aquí'],
        },
        {
          kind: 'rewrite',
          es: 'Alguien sospechaba que Andrés había causado la discusión.',
          ru: 'Кто-то подозревал, что спор вызвал Андрес.',
          answers: ['Se sospechaba que Andrés había causado la discusión'],
        },
        {
          kind: 'rewrite',
          es: 'La gente supone que Nacho es muy inteligente.',
          ru: 'Люди предполагают, что Начо очень умён.',
          answers: ['Se supone que Nacho es muy inteligente'],
        },
        {
          kind: 'rewrite',
          es: 'Para jugar bien al baloncesto no es necesario ser alto.',
          ru: 'Чтобы хорошо играть в баскетбол, не обязательно быть высоким.',
          answers: ['No se necesita ser alto para jugar bien al baloncesto'],
        },
        {
          kind: 'rewrite',
          es: 'Algunas personas esperan que el Presidente hable mañana.',
          ru: 'Некоторые люди ожидают, что президент выступит завтра.',
          answers: ['Se espera que el Presidente hable mañana'],
        },
      ],
    },
    {
      id: '122.3',
      task: 'Una las dos oraciones como en el ejemplo. Haga los cambios necesarios. — Объедините два предложения, как в примере. Внесите необходимые изменения.',
      rule: 'Es + прилагательное + инфинитив — безличная оценка действия: Es fácil equivocarse, Es importante no equivocarse. «Hay que», «se puede» и «la gente» опускаются, остаётся инфинитив (с no, если было отрицание).',
      items: [
        {
          kind: 'rewrite',
          es: 'La gente se equivoca. Es fácil.',
          ru: 'Люди ошибаются. Это просто. → Ошибаться легко.',
          answers: ['Es fácil equivocarse'],
        },
        {
          kind: 'rewrite',
          es: 'No hay que equivocarse. Es importante.',
          ru: 'Нельзя ошибаться. Это важно. → Важно не ошибаться.',
          answers: ['Es importante no equivocarse'],
        },
        {
          kind: 'rewrite',
          es: 'Hay que ser abiertos. Es mejor.',
          ru: 'Надо быть открытыми. Это лучше. → Лучше быть открытыми.',
          answers: ['Es mejor ser abiertos'],
        },
        {
          kind: 'rewrite',
          es: 'Hay que saber cocinar. Es útil.',
          ru: 'Надо уметь готовить. Это полезно. → Полезно уметь готовить.',
          answers: ['Es útil saber cocinar'],
        },
        {
          kind: 'rewrite',
          es: 'Hay que hacer ejercicio. Es bueno.',
          ru: 'Надо заниматься спортом. Это хорошо. → Хорошо заниматься спортом.',
          answers: ['Es bueno hacer ejercicio'],
        },
        {
          kind: 'rewrite',
          es: 'No hay que ser egoísta. Es malo.',
          ru: 'Нельзя быть эгоистом. Это плохо. → Плохо быть эгоистом.',
          answers: ['Es malo ser egoísta'],
        },
        {
          kind: 'rewrite',
          es: 'No se puede estudiar con tanto ruido. Es difícil.',
          ru: 'Нельзя заниматься при таком шуме. Это трудно. → Трудно заниматься при таком шуме.',
          answers: ['Es difícil estudiar con tanto ruido'],
        },
        {
          kind: 'rewrite',
          es: 'No se puede salir con este tiempo. Es imposible.',
          ru: 'Нельзя выходить в такую погоду. Это невозможно. → Невозможно выходить в такую погоду.',
          answers: ['Es imposible salir con este tiempo'],
        },
      ],
    },
    {
      id: '122.4',
      task: 'Complete las frases con los siguientes verbos en la forma adecuada: amanecer, anochecer, haber, hacer, nevar, ser. — Дополните предложения следующими глаголами в нужной форме.',
      rule: 'Безличные глаголы: погода и время суток — только 3-е лицо ед. числа (nevar → nieva / ha nevado, amanecer → amanece, anochecer → anochece, hacer frío/calor → hace/hizo). Hacer + период времени = «назад / уже»: hace dos meses, ¿cuánto tiempo hace que...?; hay que + инфинитив = «надо»; es temprano/tarde — время; hay luz — «светло».',
      bank: 'amanecer, anochecer, haber, hacer, nevar, ser',
      items: [
        {
          kind: 'fill',
          es: '___ bastante frío durante la noche.',
          ru: 'Ночью было довольно холодно.',
          blanks: [['Hizo']],
          cue: 'hacer',
        },
        {
          kind: 'fill',
          es: '___ que acostarse temprano. Mañana salimos a las siete.',
          ru: 'Надо лечь спать рано. Завтра мы выезжаем в семь.',
          blanks: [['Hay']],
          cue: 'haber',
        },
        {
          kind: 'fill',
          es: 'Ya ___ dos meses que no voy a la piscina.',
          ru: 'Уже два месяца, как я не хожу в бассейн.',
          blanks: [['hace']],
          cue: 'hacer',
        },
        {
          kind: 'fill',
          es: '—¿A qué hora ___ en esta parte de México? —Pronto. A las cinco de la tarde.',
          ru: '— Во сколько темнеет в этой части Мексики? — Рано. В пять часов вечера.',
          blanks: [['anochece']],
          cue: 'anochecer',
        },
        {
          kind: 'fill',
          es: 'Abre la ventana. ___ calor.',
          ru: 'Открой окно. Жарко.',
          blanks: [['Hace']],
          cue: 'hacer',
        },
        {
          kind: 'fill',
          es: '¿Cuánto tiempo ___ que no nos veíamos?',
          ru: 'Сколько времени мы не виделись?',
          blanks: [['hace', 'hacía']],
          cue: 'hacer',
        },
        {
          kind: 'fill',
          es: 'Hoy ___ en la sierra. Las cumbres están blancas.',
          ru: 'Сегодня в горах шёл снег. Вершины белые.',
          blanks: [['ha nevado']],
          cue: 'nevar',
        },
        {
          kind: 'fill',
          es: '___ temprano. Aún no ___ luz. En invierno ___ muy tarde.',
          ru: 'Рано. Ещё нет света. Зимой рассветает очень поздно.',
          blanks: [['Es'], ['hay'], ['amanece']],
          cue: 'ser; haber; amanecer',
        },
      ],
    },
  ],
}

export default chapter
