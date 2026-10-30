import type { Chapter } from '../../types'

const chapter: Chapter = {
  unit: 36,
  title: 'Pronombres personales de complemento indirecto',
  ru: 'Местоимения косвенного дополнения: me, te, le, nos, os, les',
  tags: ['pronombres', 'personales', 'complementos'],
  sets: [
    {
      task: '36.1 Complete con me, te, le… — Дополните местоимениями me, te, le…',
      rule: 'Косвенное дополнение: me, te, le, nos, os, les. Le/les — «ему, ей, вам (usted), им, вам (ustedes)». Стоит перед глаголом: «¿Qué te ha regalado?»',
      items: [
        {
          kind: 'rewrite',
          es: '¿Qué ___ ha regalado? — ___ ha regalado un pañuelo.',
          ru: 'Что тебе подарили? — Мне подарили платок.',
          answer: 'te; Me',
          answers: ['te', 'Me'],
          prompt: 'Картинка ①: вопрос и ответ.',
          image: 'book/36.1-1.jpg',
        },
        { kind: 'rewrite', es: '___ ha regalado unos libros.', ru: 'Нам подарили книги.', answer: 'Nos', prompt: 'Картинка ②.', image: 'book/36.1-2.jpg' },
        { kind: 'rewrite', es: '___ ha regalado una bufanda.', ru: 'Ему подарили шарф.', answer: 'Le', prompt: 'Картинка ③.', image: 'book/36.1-3.jpg' },
        { kind: 'rewrite', es: '¿Qué ___ ha regalado a usted?', ru: 'Что подарили вам?', answer: 'le', prompt: 'Картинка ④.', image: 'book/36.1-4.jpg' },
        { kind: 'rewrite', es: '___ ha regalado perfume.', ru: 'Им подарили духи.', answer: 'Les', prompt: 'Картинка ⑤.', image: 'book/36.1-5.jpg' },
        { kind: 'rewrite', es: '¿Qué ___ ha regalado?', ru: 'Что подарили вам?', answer: 'os', prompt: 'Картинка ⑥.', image: 'book/36.1-6.jpg' },
        { kind: 'rewrite', es: '___ ha regalado un paraguas.', ru: 'Ей подарили зонт.', answer: 'Le', prompt: 'Картинка ⑦.', image: 'book/36.1-7.jpg' },
      ],
    },
    {
      task: '36.2 Responda a estas preguntas siguiendo el modelo. — Ответьте на вопросы по образцу.',
      rule: 'Ответ повторяет местоимение вопроса, но меняет лицо: «¿Qué te han dicho? — No me han dicho nada»; «¿Qué os ha dado? — No nos ha dado nada». С usted отвечают me, с ustedes — nos.',
      items: [
        { kind: 'rewrite', es: '¿Qué te han dicho?', ru: 'Что тебе сказали?', answer: 'No me han dicho nada' },
        { kind: 'rewrite', es: '¿Qué le ha dicho a usted?', ru: 'Что он сказал вам?', answer: 'No me ha dicho nada' },
        { kind: 'rewrite', es: '¿Qué os ha dado?', ru: 'Что он вам дал?', answer: 'No nos ha dado nada' },
        { kind: 'rewrite', es: '¿Qué le han preguntado a Susana?', ru: 'О чём спросили Сусану?', answer: 'No le han preguntado nada' },
        { kind: 'rewrite', es: '¿Qué me ha dicho?', ru: 'Что он мне сказал?', answer: 'No te ha dicho nada' },
        {
          kind: 'rewrite',
          es: '¿Qué nos han preguntado?',
          ru: 'О чём нас спросили?',
          answer: 'No os han preguntado nada',
          also: ['No nos han preguntado nada'],
        },
        { kind: 'rewrite', es: '¿Qué te ha vendido?', ru: 'Что он тебе продал?', answer: 'No me ha vendido nada' },
        { kind: 'rewrite', es: '¿Qué les han dado a ustedes?', ru: 'Что дали вам?', answer: 'No nos han dado nada' },
        { kind: 'rewrite', es: '¿Qué le han preguntado a Alberto?', ru: 'О чём спросили Альберто?', answer: 'No le han preguntado nada' },
        { kind: 'rewrite', es: '¿Qué les han regalado a tus hijas?', ru: 'Что подарили твоим дочерям?', answer: 'No les han regalado nada' },
      ],
    },
    {
      task: '36.3 Escriba preguntas y respuestas como en el ejemplo. — Напишите вопросы и ответы по образцу.',
      rule: 'Косвенное дополнение часто дублируют: «¿Le dijo algo a Marcela?», «A Marcela no le dijo nada». Дублирующее a + ударное местоимение (a mí, a nosotros, a ti) нужно для контраста.',
      items: [
        { kind: 'rewrite', es: '¿Te dijo algo Luis?', ru: 'Луис что-нибудь тебе сказал? — Мне он ничего не сказал.', answer: 'A mí no me dijo nada' },
        {
          kind: 'rewrite',
          es: '¿Te dijo algo Luis? (¿a ustedes?)',
          ru: 'Вам Луис что-нибудь сказал? — Нам он ничего не сказал.',
          answer: '¿Les dijo algo a ustedes? A nosotros no nos dijo nada',
        },
        {
          kind: 'rewrite',
          es: '¿Te dijo algo Luis? (¿a Marcela?)',
          ru: 'Марселе Луис что-нибудь сказал? — Марселе он ничего не сказал.',
          answer: '¿Le dijo algo a Marcela? A Marcela no le dijo nada',
          also: ['¿Le dijo algo a Marcela? A ella no le dijo nada'],
        },
        {
          kind: 'rewrite',
          es: '¿Os ha preguntado algo Lola?',
          ru: 'Лола вас о чём-нибудь спрашивала? — Нас она ни о чём не спрашивала.',
          answer: 'A nosotros no nos ha preguntado nada',
        },
        {
          kind: 'rewrite',
          es: '¿Os ha preguntado algo Lola? (¿a Tomás?)',
          ru: 'Лола Томаса о чём-нибудь спрашивала? — Томаса она ни о чём не спрашивала.',
          answer: '¿Le ha preguntado algo a Tomás? A Tomás no le ha preguntado nada',
          also: ['¿Le ha preguntado algo a Tomás? A él no le ha preguntado nada'],
        },
        {
          kind: 'rewrite',
          es: '¿Os ha preguntado algo Lola? (¿a usted?)',
          ru: 'Лола вас о чём-нибудь спрашивала? — Меня она ни о чём не спрашивала.',
          answer: '¿Le ha preguntado algo a usted? A mí no me ha preguntado nada',
        },
        {
          kind: 'rewrite',
          es: '¿Me ha comprado algo Yvonne?',
          ru: 'Ивонна мне что-нибудь купила? — Тебе она ничего не купила.',
          answer: 'A ti no te ha comprado nada',
        },
        {
          kind: 'rewrite',
          es: '¿Me ha comprado algo Yvonne? (¿a nosotros?)',
          ru: 'Ивонна нам что-нибудь купила? — Вам она ничего не купила.',
          answer: '¿Nos ha comprado algo a nosotros? A vosotros no os ha comprado nada',
          also: ['¿Nos ha comprado algo a nosotros? A nosotros no nos ha comprado nada'],
        },
        {
          kind: 'rewrite',
          es: '¿Me ha comprado algo Yvonne? (¿a su hermano?)',
          ru: 'Ивонна что-нибудь купила вашему брату? — Брату она ничего не купила.',
          answer: '¿Le ha comprado algo a su hermano? A su hermano no le ha comprado nada',
          also: ['¿Le ha comprado algo a su hermano? A él no le ha comprado nada'],
        },
      ],
    },
  ],
}

export default chapter
