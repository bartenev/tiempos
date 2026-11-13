// Упражнения на артикли из двух учебников — источник правды в source/*.json
// (перенесены из проекта espanol без изменений): тексты пунктов, ответы по ключам,
// разметка для алгоритма v2. Формат полей — в блоке `conventions` каждого JSON.
import type { ArticleBook, ArticleSource, RawAnnotations, RawBookData } from '../../lib/articles/build'
import { buildArticles } from '../../lib/articles/build'
import gbeAnnotationsV2 from './source/gbe-05-annotations-v2.json'
import gbeAnnotations from './source/gbe-05-annotations.json'
import gbeData from './source/gbe-05-articulos.json'
import gduAnnotationsV2 from './source/gdu-annotations-v2.json'
import gduAnnotations from './source/gdu-annotations.json'
import gduData from './source/gdu-articulos.json'

export const ARTICLE_SOURCES: ArticleSource[] = [
  {
    book: 'GBE',
    data: gbeData as unknown as RawBookData,
    annotations: gbeAnnotations as unknown as RawAnnotations,
    overlay: gbeAnnotationsV2 as unknown as RawAnnotations,
  },
  {
    book: 'GDU',
    data: gduData as unknown as RawBookData,
    annotations: gduAnnotations as unknown as RawAnnotations,
    overlay: gduAnnotationsV2 as unknown as RawAnnotations,
  },
]

/** Коротко об учебниках — для ссылки «откуда задание». */
export const ARTICLE_BOOKS: Record<ArticleBook, { title: string; short: string }> = {
  GBE: {
    title: 'Gramática básica del estudiante de español (2021), гл. 5 «Artículos»',
    short: 'Gramática básica del estudiante',
  },
  GDU: {
    title: 'Gramática de uso del español A1-B2 (Aragonés, Palencia), юниты 4–11',
    short: 'Gramática de uso A1-B2',
  },
}

const built = buildArticles(ARTICLE_SOURCES)

/** Все задания: 527 пропусков (GBE — 162, GDU — 365). */
export const ARTICLE_ITEMS = built.items

/** Упражнения учебников: условие и страница. */
export const ARTICLE_EXERCISES = built.exercises

/**
 * Какие артикли разрешает условие учебника — только там, где без него ответ спорный:
 * голые слова без предложения («___ flor»: una и la одинаково верны) и предложения,
 * где по смыслу подходят два артикля, а ключ дан под условие («Quiero ___ vaqueros»).
 * Остальные кнопки на карточке заблокированы (не скрыты). Ключ — `${учебник} ${упражнение}`.
 */
export const ARTICLE_ALLOWED: Record<string, string[]> = {
  // «Complete con un, una, unos, unas.»
  'GDU 4.1': ['un', 'una', 'unos', 'unas'],
  // «Escriba lo que hay en cada ilustración utilizando un, una, unos, unas…»
  'GDU 4.3': ['un', 'una', 'unos', 'unas'],
  // «Complete las frases con un, una, unos, unas.»
  'GDU 4.4': ['un', 'una', 'unos', 'unas'],
  // «Complete con el, la, los, las.»
  'GDU 6.1': ['el', 'la', 'los', 'las'],
  // «Complete las frases con las palabras del recuadro y el, la, los, las.»
  'GDU 6.3': ['el', 'la', 'los', 'las'],
  // «Complete con un, una, unos, unas o el, la, los, las.»
  'GDU 7.3': ['un', 'una', 'unos', 'unas', 'el', 'la', 'los', 'las'],
  // «Complete las frases con el, la, los, las o uno, una, unos, unas…»
  'GDU 11.1': ['el', 'la', 'los', 'las', 'uno', 'una', 'unos', 'unas'],
}
