import type { ArticleRule, ArticleTopic } from '../../types'
import type { RuleCode } from './algorithm'
import type { ArticleItem } from './build'

/**
 * Темы артиклей — по правилу, которое решает пропуск, а не по главе учебника.
 * Порядок — как в дереве решений: форма, ядро (un/el, Ø, обобщение), особые случаи.
 */
export interface TopicInfo {
  topic: ArticleTopic
  label: string
  rules: { rule: ArticleRule; label: string; short: string }[]
}

export const ARTICLE_TOPICS: TopicInfo[] = [
  {
    topic: 'form',
    label: 'Форма',
    rules: [
      { rule: 'gender', label: 'Род и число: un, una, unos, unas', short: 'род и число' },
      { rule: 'a-tonica', label: 'el agua, un águila — но la otra agua', short: 'el agua' },
      { rule: 'contraction', label: 'a + el = al, de + el = del', short: 'al / del' },
      { rule: 'no-noun', label: 'Без существительного: el de Soria, uno rojo', short: 'без сущ.' },
    ],
  },
  {
    topic: 'concrete',
    label: 'un или el',
    rules: [
      { rule: 'new', label: 'Новый, один из многих → un', short: 'новый' },
      { rule: 'unique', label: 'Единственный, ясно какой → el', short: 'единственный' },
      { rule: 'mentioned', label: 'О нём уже говорили → el', short: 'уже говорили' },
    ],
  },
  {
    topic: 'zero',
    label: 'Без артикля (Ø)',
    rules: [
      { rule: 'type', label: 'Тип, средство, материал: en bicicleta', short: 'тип' },
      { rule: 'quantity', label: 'Неопределённое количество: bebo agua', short: 'количество' },
      { rule: 'eval', label: 'Но с оценкой → un: un pan buenísimo', short: 'с оценкой' },
    ],
  },
  {
    topic: 'general',
    label: 'Обобщение',
    rules: [
      { rule: 'class', label: 'Весь класс → el: el café es…', short: 'весь класс' },
      { rule: 'any', label: 'Любой представитель → un', short: 'любой' },
    ],
  },
  {
    topic: 'names',
    label: 'Имена и места',
    rules: [
      { rule: 'people', label: 'Люди: Elena, el señor Alonso', short: 'люди' },
      { rule: 'places', label: 'Места: Bolivia, la calle Mayor, el Tajo', short: 'места' },
      { rule: 'place-names', label: 'Артикль в названии: La Habana, El Cairo', short: 'La Habana' },
    ],
  },
  {
    topic: 'time',
    label: 'Время',
    rules: [
      { rule: 'hours', label: 'Часы: son las tres', short: 'часы' },
      { rule: 'days', label: 'Дни, даты, месяцы: el lunes, en octubre', short: 'дни и даты' },
      { rule: 'per', label: 'por la mañana, dos veces al día, el kilo', short: 'части дня, частота' },
    ],
  },
  {
    topic: 'pred',
    label: 'Профессия после ser',
    rules: [
      { rule: 'pred-zero', label: 'Ø: es médico, es español', short: 'Ø' },
      { rule: 'pred-un', label: 'un: с оценкой или «¿Quién es…?»', short: 'un' },
    ],
  },
  {
    topic: 'lex',
    label: 'Устойчивые сочетания',
    rules: [
      { rule: 'play', label: 'tocar el piano, jugar al fútbol', short: 'tocar, jugar' },
      { rule: 'go', label: 'ir al médico, ir a casa', short: 'ir a…' },
      { rule: 'learn', label: 'Языки и занятия: hablar inglés, las matemáticas', short: 'языки, занятия' },
      { rule: 'institutions', label: 'la policía, la radio, el mar', short: 'policía, radio, mar' },
    ],
  },
  {
    topic: 'lo',
    label: 'lo + прилагательное',
    rules: [{ rule: 'lo', label: 'lo bueno, lo amargo', short: 'lo' }],
  },
]

export const ARTICLE_RULES: ArticleRule[] = ARTICLE_TOPICS.flatMap((t) => t.rules.map((r) => r.rule))

/** Главное правило по коду алгоритма, который решил выбор. */
const MAIN_RULE: Partial<Record<RuleCode, ArticleRule>> = {
  'B.indef': 'new',
  'B.I': 'unique',
  'B.II': 'mentioned',
  'C.tipo': 'type',
  'C.cantidad': 'quantity',
  'D.clase': 'class',
  'D.cualquiera': 'any',
  'S.name-title': 'people',
  'S.name-zero': 'people',
  'S.place-art': 'places',
  'S.place-zero': 'places',
  'S.place-exc': 'place-names',
  'S.hour': 'hours',
  'S.weekday': 'days',
  'S.date': 'days',
  'S.day-pred': 'days',
  'S.after-weekday': 'days',
  'S.month': 'days',
  'S.daypart': 'per',
  'S.per': 'per',
  'S.pred-zero': 'pred-zero',
  'S.pred-un': 'pred-un',
  'S.tocar': 'play',
  'S.jugar': 'play',
  'S.go-def': 'go',
  'S.go-zero': 'go',
  'S.learn': 'learn',
  'S.hacer': 'learn',
  'S.subject': 'learn',
  'S.institution': 'institutions',
  'S.media': 'institutions',
  'S.nature': 'institutions',
  'S.lo': 'lo',
}

/** Правила формы — добавляются тегом к главному. */
const FORM_RULE: Partial<Record<RuleCode, ArticleRule>> = {
  'A.a-tonica': 'a-tonica',
  'A.a-tonica-no': 'a-tonica',
  'A.contraccion': 'contraction',
  'A.no-contraccion': 'contraction',
  'A.uno': 'no-noun',
  'E.indef-sin-sust': 'no-noun',
  'E.def-sin-sust': 'no-noun',
}

/**
 * Теги задания: главное правило (что решило выбор) и правила формы, если они есть.
 * «¿Qué zapatos…, ___ negros?» → los: «единственный» + «без существительного».
 */
export function rulesOf(item: Pick<ArticleItem, 'path' | 'category'>): ArticleRule[] {
  const rules: ArticleRule[] = []
  if (item.category === 'form') rules.push('gender')
  else if (item.path.includes('C.eval')) rules.push('eval')
  else {
    const main = MAIN_RULE[item.path[0]!]
    if (main) rules.push(main)
  }
  for (const code of item.path) {
    const form = FORM_RULE[code]
    if (form && !rules.includes(form)) rules.push(form)
  }
  return rules
}

const TOPIC_OF = new Map<ArticleRule, TopicInfo>(
  ARTICLE_TOPICS.flatMap((t) => t.rules.map((r) => [r.rule, t] as const)),
)

export function topicOf(rule: ArticleRule): TopicInfo {
  return TOPIC_OF.get(rule)!
}
