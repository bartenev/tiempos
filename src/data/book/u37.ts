import type { Chapter } from '../../types'

const chapter: Chapter = {
  unit: 37,
  title: 'Pronombres de complemento indirecto y directo',
  ru: 'Два местоимения подряд: me lo, te la, se lo, nos los',
  section: 'pronombres',
  tags: ['personales', 'complementos'],
  sets: [
    {
      id: '37.1',
      task: '37.1 Complete las respuestas con me, te, se… y lo, la, los, las… — Дополните ответы местоимениями me, te, se… и lo, la, los, las…',
      rule: 'Два местоимения подряд: сначала косвенное (me, te, se, nos, os), потом прямое (lo, la, los, las). Прямое согласуется с предметом, косвенное — с получателем.',
      items: [
        {
          kind: 'fill',
          es: '—¿Quién te ha regalado esos bombones? —___ ___ ha regalado Anita.',
          ru: '— Кто подарил тебе эти конфеты? — Мне их подарила Анита.',
          blanks: [['Me'], ['los']],
        },
        {
          kind: 'fill',
          es: '—¿Quién les ha prestado el dinero a tus padres? —___ ___ ha prestado Juan.',
          ru: '— Кто одолжил деньги твоим родителям? — Им его одолжил Хуан.',
          blanks: [['Se'], ['lo']],
        },
        {
          kind: 'fill',
          es: '—¿Quién os ha enviado ese paquete? —___ ___ ha enviado mi tía Rosa.',
          ru: '— Кто вам прислал эту посылку? — Нам её прислала моя тётя Роса.',
          blanks: [['Nos'], ['lo']],
        },
        {
          kind: 'fill',
          es: '—¿Quién me envía estas flores? —___ ___ envía Raúl.',
          ru: '— Кто присылает мне эти цветы? — Тебе их присылает Рауль.',
          blanks: [['Te'], ['las']],
        },
        {
          kind: 'fill',
          es: '—¿Quién le ha regalado esa corbata, Antonio? —___ ___ ha regalado mi mujer.',
          ru: '— Кто подарил вам этот галстук, Антонио? — Мне его подарила жена.',
          blanks: [['Me'], ['la']],
        },
        {
          kind: 'fill',
          es: '—¿Quién les ha enseñado el museo a ustedes? —___ ___ ha enseñado un guía turístico.',
          ru: '— Кто показал вам музей? — Нам его показал экскурсовод.',
          blanks: [['Nos'], ['lo']],
        },
      ],
    },
    {
      id: '37.2',
      task: '37.2 Conteste a las preguntas. — Ответьте на вопросы.',
      rule: 'Оба местоимения идут перед глаголом (и перед haber): «no me lo ha dado». Le/les + lo/la/los/las → se lo/se la/se los/se las: «se lo ha presentado».',
      items: [
        {
          kind: 'fill',
          es: '—¿Te ha dado Pepe el regalo? —No, ___.',
          ru: '— Пепе дал тебе подарок? — Нет, не дал.',
          blanks: [['no me lo ha dado']],
        },
        {
          kind: 'fill',
          es: '—¿Os ha prestado Pablo el dinero? —Sí, ___.',
          ru: '— Пабло одолжил вам деньги? — Да, одолжил.',
          blanks: [['nos lo ha prestado']],
        },
        {
          kind: 'fill',
          es: '—¿Les ha presentado Sara su novio a sus padres? —No, ___.',
          ru: '— Сара познакомила своего парня с родителями? — Нет, не познакомила.',
          blanks: [['no se lo ha presentado']],
        },
        {
          kind: 'fill',
          es: '—¿Le ha enseñado a usted su casa Marta? —Sí, ___.',
          ru: '— Марта показала вам свой дом? — Да, показала.',
          blanks: [['me la ha enseñado']],
        },
        {
          kind: 'fill',
          es: '—¿Les ha presentado Hugo sus amigos a sus padres? —Sí, ___.',
          ru: '— Уго познакомил своих друзей с родителями? — Да, познакомил.',
          blanks: [['se los ha presentado']],
        },
        {
          kind: 'fill',
          es: '—¿Le ha vendido Jesús su coche a Antonia? —No, ___.',
          ru: '— Хесус продал свою машину Антонии? — Нет, не продал.',
          blanks: [['no se lo ha vendido']],
        },
        {
          kind: 'fill',
          es: '—¿Les ha enseñado a ustedes los cuadros Ramón? —Sí, ___.',
          ru: '— Рамон показал вам картины? — Да, показал.',
          blanks: [['nos los ha enseñado']],
        },
        {
          kind: 'fill',
          es: '—¿Me ha traído Rita las entradas? —Sí, ___.',
          ru: '— Рита принесла мне билеты? — Да, принесла.',
          blanks: [['te las ha traído']],
        },
      ],
    },
    {
      id: '37.3',
      task: '37.3 Complete con me, te, se… y lo, la, los, las. — Дополните местоимениями me, te, se… и lo, la, los, las.',
      rule: 'Косвенное дополнение в скобках (a él, a mí, a ellos…) подсказывает первое местоимение: a él/ella/usted/ellos/ellas → se; a mí → me; a ti → te; a nosotros → nos; a vosotros → os. Второе — lo/la/los/las по предмету.',
      items: [
        {
          kind: 'fill',
          es: 'Este paraguas (a él) ___ ___ regaló Andrea.',
          ru: 'Этот зонт ему подарила Андреа.',
          blanks: [['se'], ['lo']],
        },
        {
          kind: 'fill',
          es: 'Esta corbata (a mí) ___ ___ regaló mi novia.',
          ru: 'Этот галстук мне подарила моя девушка.',
          blanks: [['me'], ['la']],
        },
        {
          kind: 'fill',
          es: 'Ese coche (a ellos) ___ ___ ha vendido un amigo.',
          ru: 'Эту машину им продал друг.',
          blanks: [['se'], ['lo']],
        },
        {
          kind: 'fill',
          es: 'Esa lámpara (a nosotros) ___ ___ ha regalado una tía de Alberto.',
          ru: 'Эту лампу нам подарила тётя Альберто.',
          blanks: [['nos'], ['la']],
        },
        {
          kind: 'fill',
          es: 'Esas flores (a ella) ___ ___ ha traído su novio.',
          ru: 'Эти цветы ей принёс её парень.',
          blanks: [['se'], ['las']],
        },
        {
          kind: 'fill',
          es: 'Este paquete (a usted) ___ ___ ha traído un mensajero.',
          ru: 'Эту посылку вам принёс курьер.',
          blanks: [['se'], ['lo']],
        },
        {
          kind: 'fill',
          es: 'Esos bombones (a ellas) ___ ___ ha comprado su hermano.',
          ru: 'Эти конфеты им купил их брат.',
          blanks: [['se'], ['los']],
        },
        {
          kind: 'fill',
          es: 'Este libro (a ti) ___ ___ ha traído Víctor.',
          ru: 'Эту книгу тебе принёс Виктор.',
          blanks: [['te'], ['lo']],
        },
        {
          kind: 'fill',
          es: 'Esta carta (a mí) ___ ___ envía una amiga de Perú.',
          ru: 'Это письмо мне присылает подруга из Перу.',
          blanks: [['me'], ['la']],
        },
        {
          kind: 'fill',
          es: 'Estos helados (a vosotros) ___ ___ compro yo.',
          ru: 'Это мороженое вам покупаю я.',
          blanks: [['os'], ['los']],
        },
      ],
    },
    {
      id: '37.4',
      task: '37.4 Responda como en el ejemplo. — Ответьте по образцу.',
      rule: 'В ответе с a + ударное местоимение дополнение дублируется: «a mí no me las ha dado». Для прямого дополнения-человека (la han aprobado a Teresa) используют lo/la/los/las, а не le.',
      items: [
        {
          kind: 'fill',
          es: '—¿Te ha dado las entradas? —No, ___.',
          ru: '— Он дал тебе билеты? — Нет, мне не дал.',
          blanks: [['a mí no me las ha dado']],
        },
        {
          kind: 'fill',
          es: '—¿Le ha dado a usted el dinero? —No, ___.',
          ru: '— Он дал вам деньги? — Нет, мне не дал.',
          blanks: [['a mí no me lo ha dado']],
        },
        {
          kind: 'fill',
          es: '—¿Os ha dado las llaves? —No, ___.',
          ru: '— Он дал вам ключи? — Нет, нам не дал.',
          blanks: [['a nosotros no nos las ha dado']],
        },
        {
          kind: 'fill',
          es: '—¿Me ha enviado el paquete? —No, ___, don Antonio.',
          ru: '— Он отправил мне посылку? — Нет, вам не отправил, дон Антонио.',
          blanks: [['a usted no se lo ha enviado']],
        },
        {
          kind: 'fill',
          es: '—¿Nos han aprobado? —No, ___.',
          ru: '— Нас приняли (зачли)? — Нет, нас не приняли.',
          blanks: [['a nosotros no nos han aprobado', 'a vosotros no os han aprobado']],
        },
        {
          kind: 'fill',
          es: '—¿La han aprobado a Teresa? —Sí, ___.',
          ru: '— Терезу приняли? — Да, её приняли.',
          blanks: [['a ella la han aprobado']],
        },
        {
          kind: 'fill',
          es: '—¿Y lo han aprobado a Alfonso? —No, ___.',
          ru: '— А Альфонсо приняли? — Нет, его не приняли.',
          blanks: [['a él no lo han aprobado']],
        },
        {
          kind: 'fill',
          es: '—¿Nos han invitado a la fiesta? —No, ___.',
          ru: '— Нас пригласили на вечеринку? — Нет, нас не пригласили.',
          blanks: [['a nosotros no nos han invitado', 'a vosotros no os han invitado']],
        },
      ],
    },
  ],
}

export default chapter
