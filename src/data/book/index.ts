import type { BookTag, Chapter } from '../../types'
import u12 from './u12'
import u18 from './u18'
import u19 from './u19'
import u20 from './u20'
import u21 from './u21'
import u22 from './u22'
import u23 from './u23'
import u28 from './u28'
import u29 from './u29'
import u30 from './u30'
import u31 from './u31'
import u34 from './u34'
import u35 from './u35'
import u36 from './u36'
import u37 from './u37'
import u38 from './u38'
import u39 from './u39'
import u40 from './u40'
import u41 from './u41'
import u53 from './u53'
import u54 from './u54'
import u55 from './u55'
import u77 from './u77'
import u78 from './u78'
import u109 from './u109'
import u122 from './u122'

/** Темы в том порядке, в каком показываем их при выборе. */
export const TAGS: { tag: BookTag; label: string }[] = [
  { tag: 'pronombres', label: 'Все местоимения' },
  { tag: 'personales', label: 'Личные' },
  { tag: 'complementos', label: 'Дополнения' },
  { tag: 'reflexivos', label: 'С se' },
  { tag: 'gustar', label: 'Me gusta' },
  { tag: 'imperativo', label: 'С императивом' },
  { tag: 'preposiciones', label: 'С предлогами' },
  { tag: 'impersonales', label: 'Безличные' },
  { tag: 'demostrativos', label: 'Указательные' },
  { tag: 'posesivos', label: 'Притяжательные' },
  { tag: 'indefinidos', label: 'Неопределённые' },
  { tag: 'relativos', label: 'Относительные' },
  { tag: 'interrogativos', label: 'Вопросительные' },
]

/**
 * Главы учебника: номер = юнит, упражнения и ответы — как в источнике, переводы — русские.
 * Одна глава — один файл `uN.ts` в этой папке.
 */
export const CHAPTERS: Chapter[] = [
  u12,
  u18,
  u19,
  u20,
  u21,
  u22,
  u23,
  u28,
  u29,
  u30,
  u31,
  u34,
  u35,
  u36,
  u37,
  u38,
  u39,
  u40,
  u41,
  u53,
  u54,
  u55,
  u77,
  u78,
  u109,
  u122,
]
