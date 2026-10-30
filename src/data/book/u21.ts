import type { Chapter } from '../../types'

const chapter: Chapter = {
  unit: 21,
  title: 'Indefinidos (2)',
  ru: 'Неопределённые (2): otro, cualquiera, uno',
  tags: ['pronombres', 'indefinidos'],
  sets: [
    {
      task: '21.1 Observe las situaciones y complete las frases con un, una... u otro, otros...',
      rule: 'Un/una/unos/unas — неопределённый предмет, один из многих; otro/otra/otros/otras — ещё один, другой (артикль перед ним не ставится: otra tónica, не una otra). Otro согласуется с существительным в роде и числе.',
      items: [
        { kind: 'fill', es: '___ tónica, por favor.', ru: 'Тоник, пожалуйста.', answer: 'Una', prompt: 'Картинка ①', image: 'book/u21.jpg' },
        {
          kind: 'fill',
          es: 'Deme ___ bolsa, por favor. Esta está rota.',
          ru: 'Дайте мне другой пакет, пожалуйста. Этот порван.',
          answer: 'otra',
          prompt: 'Картинка ②',
          image: 'book/u21.jpg',
        },
        {
          kind: 'fill',
          es: 'Préstame ___ libro, por favor.',
          ru: 'Одолжи мне книгу, пожалуйста.',
          answer: 'un',
          prompt: 'Картинка ③',
          image: 'book/u21.jpg',
        },
        { kind: 'fill', es: '___ tónica, por favor.', ru: 'Ещё один тоник, пожалуйста.', answer: 'Otra', prompt: 'Картинка ④', image: 'book/u21.jpg' },
        {
          kind: 'fill',
          es: 'Préstame ___ libros. Estos los he leído.',
          ru: 'Одолжи мне другие книги. Эти я уже прочитал.',
          answer: 'otros',
          prompt: 'Картинка ⑤',
          image: 'book/u21.jpg',
        },
        {
          kind: 'fill',
          es: 'Deme ___ bolsa, por favor.',
          ru: 'Дайте мне пакет, пожалуйста.',
          answer: 'una',
          prompt: 'Картинка ⑥',
          image: 'book/u21.jpg',
        },
        {
          kind: 'fill',
          es: 'Tráiganos ___ cucharas, por favor. Estas están sucias.',
          ru: 'Принесите нам другие ложки, пожалуйста. Эти грязные.',
          answer: 'otras',
          prompt: 'Картинка ⑦',
          image: 'book/u21.jpg',
        },
        {
          kind: 'fill',
          es: '¡Qué rica estaba! ¿Me das ___ manzana?',
          ru: 'Какая вкусная была! Дашь мне ещё яблоко?',
          answer: 'otra',
          prompt: 'Картинка ⑧',
          image: 'book/u21.jpg',
        },
      ],
    },
    {
      task: '21.2 Utilice las expresiones del recuadro para completar las siguientes frases',
      rule: 'Cualquier — перед существительным (любой): cualquier tienda. Cualquiera — без существительного или после глагола: cualquiera puede hacerlo, ven cualquier día. Cualquiera de + мн. число/местоимение — любой из: cualquiera de nosotros, cualquiera de esos ordenadores.',
      bank: 'cualquier, cualquiera, cualquiera de',
      items: [
        { kind: 'fill', es: 'Esto lo puedes encontrar en ___ tienda.', ru: 'Это ты можешь найти в любом магазине.', answer: 'cualquier' },
        {
          kind: 'fill',
          es: 'Eso es complicado. No lo puede hacer ___ nosotros.',
          ru: 'Это сложно. Не любой из нас может это сделать.',
          answer: 'cualquiera de',
        },
        {
          kind: 'fill',
          es: 'Si quieres que te ayude, ven ___ mañana. Estoy siempre libre.',
          ru: 'Если хочешь, чтобы я помог, приходи завтра в любое время. Я всегда свободен.',
          answer: 'cualquier',
        },
        {
          kind: 'fill',
          es: 'Usa ___ esos ordenadores. Todos funcionan.',
          ru: 'Пользуйся любым из этих компьютеров. Все работают.',
          answer: 'cualquiera de',
        },
        { kind: 'fill', es: 'Dale una excusa ___. No le importará.', ru: 'Придумай ему любое оправдание. Ему всё равно.', answer: 'cualquiera' },
      ],
    },
    {
      task: '21.3 Escriba uno, cualquier, otro... + de cuando sea necesario',
      rule: 'Uno/una de + мн. число — один из; otro/otra/otros/otras — другой, ещё; unos/unas — какие-то, несколько. Uno/una без существительного заменяет его: Toma una (galleta). Otro/otros ставится без артикля, в том числе перед числительными: otros cinco euros.',
      items: [
        { kind: 'fill', es: '—¿Te gustan las galletas? Toma ___.', ru: '— Тебе нравится печенье? Возьми одно.', answer: 'una' },
        { kind: 'fill', es: 'Este helado estaba riquísimo. Quiero ___.', ru: 'Это мороженое было очень вкусным. Хочу ещё.', answer: 'otro' },
        {
          kind: 'fill',
          es: 'Diez euros no son suficientes. Necesitamos ___ cinco.',
          ru: 'Десяти евро недостаточно. Нам нужно ещё пять.',
          answer: 'otros',
        },
        { kind: 'fill', es: '—¿Dónde estabas? —Con ___ amigas.', ru: '— Где ты был? — С подругами.', answer: 'unas' },
        {
          kind: 'fill',
          es: 'Ayer jugué al tenis con ___ tus primos.',
          ru: 'Вчера я играл в теннис с одним из твоих двоюродных братьев.',
          answer: 'uno de',
        },
        {
          kind: 'fill',
          es: 'Si vienen Arnaldo y Marta al concierto necesitaremos ___ dos entradas.',
          ru: 'Если на концерт придут Арнальдо и Марта, нам понадобятся ещё два билета.',
          answer: 'otras',
        },
        { kind: 'fill', es: 'Quiero ___ esas corbatas.', ru: 'Хочу один из этих галстуков.', answer: 'una de' },
        { kind: 'fill', es: 'Han llegado ___ libros para la biblioteca.', ru: 'Пришли какие-то книги для библиотеки.', answer: 'unos' },
      ],
    },
    {
      task: '21.4 Complete con otro, otra, otros, otras y cualquiera',
      rule: 'Otro/otra/otros/otras — другой, ещё; cualquiera — кто угодно, любой (без существительного), для ответа «всё равно какой». Otro без существительного заменяет его: ¿Cuándo hay otro (tren)?',
      items: [
        {
          kind: 'fill',
          es: '—¿Le gustan estos zapatos? —No, enséñeme ___, por favor.',
          ru: '— Вам нравятся эти туфли? — Нет, покажите мне другие, пожалуйста.',
          answer: 'otros',
        },
        { kind: 'fill', es: 'No es muy difícil. ___ puede hacerlo.', ru: 'Это не очень сложно. Любой может это сделать.', answer: 'Cualquiera' },
        {
          kind: 'fill',
          es: '—¿Qué trabajo quieres hacer? —___. Necesito trabajar.',
          ru: '— Какую работу ты хочешь делать? — Любую. Мне нужно работать.',
          answer: 'Cualquiera',
        },
        { kind: 'fill', es: 'He perdido el tren a Cuzco. ¿Cuándo hay ___?', ru: 'Я опоздал на поезд до Куско. Когда будет следующий?', answer: 'otro' },
        {
          kind: 'fill',
          es: '—¿Le gustan estos plátanos? —No, deme ___. Esos están muy verdes.',
          ru: '— Вам нравятся эти бананы? — Нет, дайте мне другие. Эти очень зелёные.',
          answer: 'otros',
        },
      ],
    },
  ],
}

export default chapter
