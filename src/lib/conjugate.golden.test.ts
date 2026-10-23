import { describe, expect, it } from 'vitest'
import { VERBS } from '../data/verbs'
import type { Tense } from '../types'
import { PERSONS, TENSES } from '../types'
import { conjugate } from './conjugate'

/**
 * Эталон: все формы всех глаголов банка, проверенные вручную.
 * Порядок лиц: yo, tú, él, nosotros, vosotros, ellos.
 * Новый глагол в банке → добавить сюда его проверенные формы.
 */
const EXPECTED: Record<string, Record<Tense, string[]>> = {
  hablar: {
    presente: ['hablo', 'hablas', 'habla', 'hablamos', 'habláis', 'hablan'],
    indefinido: ['hablé', 'hablaste', 'habló', 'hablamos', 'hablasteis', 'hablaron'],
    imperfecto: ['hablaba', 'hablabas', 'hablaba', 'hablábamos', 'hablabais', 'hablaban'],
  },
  estudiar: {
    presente: ['estudio', 'estudias', 'estudia', 'estudiamos', 'estudiáis', 'estudian'],
    indefinido: ['estudié', 'estudiaste', 'estudió', 'estudiamos', 'estudiasteis', 'estudiaron'],
    imperfecto: ['estudiaba', 'estudiabas', 'estudiaba', 'estudiábamos', 'estudiabais', 'estudiaban'],
  },
  trabajar: {
    presente: ['trabajo', 'trabajas', 'trabaja', 'trabajamos', 'trabajáis', 'trabajan'],
    indefinido: ['trabajé', 'trabajaste', 'trabajó', 'trabajamos', 'trabajasteis', 'trabajaron'],
    imperfecto: ['trabajaba', 'trabajabas', 'trabajaba', 'trabajábamos', 'trabajabais', 'trabajaban'],
  },
  caminar: {
    presente: ['camino', 'caminas', 'camina', 'caminamos', 'camináis', 'caminan'],
    indefinido: ['caminé', 'caminaste', 'caminó', 'caminamos', 'caminasteis', 'caminaron'],
    imperfecto: ['caminaba', 'caminabas', 'caminaba', 'caminábamos', 'caminabais', 'caminaban'],
  },
  comprar: {
    presente: ['compro', 'compras', 'compra', 'compramos', 'compráis', 'compran'],
    indefinido: ['compré', 'compraste', 'compró', 'compramos', 'comprasteis', 'compraron'],
    imperfecto: ['compraba', 'comprabas', 'compraba', 'comprábamos', 'comprabais', 'compraban'],
  },
  mirar: {
    presente: ['miro', 'miras', 'mira', 'miramos', 'miráis', 'miran'],
    indefinido: ['miré', 'miraste', 'miró', 'miramos', 'mirasteis', 'miraron'],
    imperfecto: ['miraba', 'mirabas', 'miraba', 'mirábamos', 'mirabais', 'miraban'],
  },
  escuchar: {
    presente: ['escucho', 'escuchas', 'escucha', 'escuchamos', 'escucháis', 'escuchan'],
    indefinido: ['escuché', 'escuchaste', 'escuchó', 'escuchamos', 'escuchasteis', 'escucharon'],
    imperfecto: ['escuchaba', 'escuchabas', 'escuchaba', 'escuchábamos', 'escuchabais', 'escuchaban'],
  },
  cantar: {
    presente: ['canto', 'cantas', 'canta', 'cantamos', 'cantáis', 'cantan'],
    indefinido: ['canté', 'cantaste', 'cantó', 'cantamos', 'cantasteis', 'cantaron'],
    imperfecto: ['cantaba', 'cantabas', 'cantaba', 'cantábamos', 'cantabais', 'cantaban'],
  },
  bailar: {
    presente: ['bailo', 'bailas', 'baila', 'bailamos', 'bailáis', 'bailan'],
    indefinido: ['bailé', 'bailaste', 'bailó', 'bailamos', 'bailasteis', 'bailaron'],
    imperfecto: ['bailaba', 'bailabas', 'bailaba', 'bailábamos', 'bailabais', 'bailaban'],
  },
  cocinar: {
    presente: ['cocino', 'cocinas', 'cocina', 'cocinamos', 'cocináis', 'cocinan'],
    indefinido: ['cociné', 'cocinaste', 'cocinó', 'cocinamos', 'cocinasteis', 'cocinaron'],
    imperfecto: ['cocinaba', 'cocinabas', 'cocinaba', 'cocinábamos', 'cocinabais', 'cocinaban'],
  },
  llegar: {
    presente: ['llego', 'llegas', 'llega', 'llegamos', 'llegáis', 'llegan'],
    indefinido: ['llegué', 'llegaste', 'llegó', 'llegamos', 'llegasteis', 'llegaron'],
    imperfecto: ['llegaba', 'llegabas', 'llegaba', 'llegábamos', 'llegabais', 'llegaban'],
  },
  buscar: {
    presente: ['busco', 'buscas', 'busca', 'buscamos', 'buscáis', 'buscan'],
    indefinido: ['busqué', 'buscaste', 'buscó', 'buscamos', 'buscasteis', 'buscaron'],
    imperfecto: ['buscaba', 'buscabas', 'buscaba', 'buscábamos', 'buscabais', 'buscaban'],
  },
  tomar: {
    presente: ['tomo', 'tomas', 'toma', 'tomamos', 'tomáis', 'toman'],
    indefinido: ['tomé', 'tomaste', 'tomó', 'tomamos', 'tomasteis', 'tomaron'],
    imperfecto: ['tomaba', 'tomabas', 'tomaba', 'tomábamos', 'tomabais', 'tomaban'],
  },
  necesitar: {
    presente: ['necesito', 'necesitas', 'necesita', 'necesitamos', 'necesitáis', 'necesitan'],
    indefinido: ['necesité', 'necesitaste', 'necesitó', 'necesitamos', 'necesitasteis', 'necesitaron'],
    imperfecto: ['necesitaba', 'necesitabas', 'necesitaba', 'necesitábamos', 'necesitabais', 'necesitaban'],
  },
  comer: {
    presente: ['como', 'comes', 'come', 'comemos', 'coméis', 'comen'],
    indefinido: ['comí', 'comiste', 'comió', 'comimos', 'comisteis', 'comieron'],
    imperfecto: ['comía', 'comías', 'comía', 'comíamos', 'comíais', 'comían'],
  },
  beber: {
    presente: ['bebo', 'bebes', 'bebe', 'bebemos', 'bebéis', 'beben'],
    indefinido: ['bebí', 'bebiste', 'bebió', 'bebimos', 'bebisteis', 'bebieron'],
    imperfecto: ['bebía', 'bebías', 'bebía', 'bebíamos', 'bebíais', 'bebían'],
  },
  correr: {
    presente: ['corro', 'corres', 'corre', 'corremos', 'corréis', 'corren'],
    indefinido: ['corrí', 'corriste', 'corrió', 'corrimos', 'corristeis', 'corrieron'],
    imperfecto: ['corría', 'corrías', 'corría', 'corríamos', 'corríais', 'corrían'],
  },
  aprender: {
    presente: ['aprendo', 'aprendes', 'aprende', 'aprendemos', 'aprendéis', 'aprenden'],
    indefinido: ['aprendí', 'aprendiste', 'aprendió', 'aprendimos', 'aprendisteis', 'aprendieron'],
    imperfecto: ['aprendía', 'aprendías', 'aprendía', 'aprendíamos', 'aprendíais', 'aprendían'],
  },
  comprender: {
    presente: ['comprendo', 'comprendes', 'comprende', 'comprendemos', 'comprendéis', 'comprenden'],
    indefinido: ['comprendí', 'comprendiste', 'comprendió', 'comprendimos', 'comprendisteis', 'comprendieron'],
    imperfecto: ['comprendía', 'comprendías', 'comprendía', 'comprendíamos', 'comprendíais', 'comprendían'],
  },
  vender: {
    presente: ['vendo', 'vendes', 'vende', 'vendemos', 'vendéis', 'venden'],
    indefinido: ['vendí', 'vendiste', 'vendió', 'vendimos', 'vendisteis', 'vendieron'],
    imperfecto: ['vendía', 'vendías', 'vendía', 'vendíamos', 'vendíais', 'vendían'],
  },
  responder: {
    presente: ['respondo', 'respondes', 'responde', 'respondemos', 'respondéis', 'responden'],
    indefinido: ['respondí', 'respondiste', 'respondió', 'respondimos', 'respondisteis', 'respondieron'],
    imperfecto: ['respondía', 'respondías', 'respondía', 'respondíamos', 'respondíais', 'respondían'],
  },
  vivir: {
    presente: ['vivo', 'vives', 'vive', 'vivimos', 'vivís', 'viven'],
    indefinido: ['viví', 'viviste', 'vivió', 'vivimos', 'vivisteis', 'vivieron'],
    imperfecto: ['vivía', 'vivías', 'vivía', 'vivíamos', 'vivíais', 'vivían'],
  },
  escribir: {
    presente: ['escribo', 'escribes', 'escribe', 'escribimos', 'escribís', 'escriben'],
    indefinido: ['escribí', 'escribiste', 'escribió', 'escribimos', 'escribisteis', 'escribieron'],
    imperfecto: ['escribía', 'escribías', 'escribía', 'escribíamos', 'escribíais', 'escribían'],
  },
  abrir: {
    presente: ['abro', 'abres', 'abre', 'abrimos', 'abrís', 'abren'],
    indefinido: ['abrí', 'abriste', 'abrió', 'abrimos', 'abristeis', 'abrieron'],
    imperfecto: ['abría', 'abrías', 'abría', 'abríamos', 'abríais', 'abrían'],
  },
  subir: {
    presente: ['subo', 'subes', 'sube', 'subimos', 'subís', 'suben'],
    indefinido: ['subí', 'subiste', 'subió', 'subimos', 'subisteis', 'subieron'],
    imperfecto: ['subía', 'subías', 'subía', 'subíamos', 'subíais', 'subían'],
  },
  decidir: {
    presente: ['decido', 'decides', 'decide', 'decidimos', 'decidís', 'deciden'],
    indefinido: ['decidí', 'decidiste', 'decidió', 'decidimos', 'decidisteis', 'decidieron'],
    imperfecto: ['decidía', 'decidías', 'decidía', 'decidíamos', 'decidíais', 'decidían'],
  },
  recibir: {
    presente: ['recibo', 'recibes', 'recibe', 'recibimos', 'recibís', 'reciben'],
    indefinido: ['recibí', 'recibiste', 'recibió', 'recibimos', 'recibisteis', 'recibieron'],
    imperfecto: ['recibía', 'recibías', 'recibía', 'recibíamos', 'recibíais', 'recibían'],
  },
  permitir: {
    presente: ['permito', 'permites', 'permite', 'permitimos', 'permitís', 'permiten'],
    indefinido: ['permití', 'permitiste', 'permitió', 'permitimos', 'permitisteis', 'permitieron'],
    imperfecto: ['permitía', 'permitías', 'permitía', 'permitíamos', 'permitíais', 'permitían'],
  },
  pensar: {
    presente: ['pienso', 'piensas', 'piensa', 'pensamos', 'pensáis', 'piensan'],
    indefinido: ['pensé', 'pensaste', 'pensó', 'pensamos', 'pensasteis', 'pensaron'],
    imperfecto: ['pensaba', 'pensabas', 'pensaba', 'pensábamos', 'pensabais', 'pensaban'],
  },
  empezar: {
    presente: ['empiezo', 'empiezas', 'empieza', 'empezamos', 'empezáis', 'empiezan'],
    indefinido: ['empecé', 'empezaste', 'empezó', 'empezamos', 'empezasteis', 'empezaron'],
    imperfecto: ['empezaba', 'empezabas', 'empezaba', 'empezábamos', 'empezabais', 'empezaban'],
  },
  encontrar: {
    presente: ['encuentro', 'encuentras', 'encuentra', 'encontramos', 'encontráis', 'encuentran'],
    indefinido: ['encontré', 'encontraste', 'encontró', 'encontramos', 'encontrasteis', 'encontraron'],
    imperfecto: ['encontraba', 'encontrabas', 'encontraba', 'encontrábamos', 'encontrabais', 'encontraban'],
  },
  volver: {
    presente: ['vuelvo', 'vuelves', 'vuelve', 'volvemos', 'volvéis', 'vuelven'],
    indefinido: ['volví', 'volviste', 'volvió', 'volvimos', 'volvisteis', 'volvieron'],
    imperfecto: ['volvía', 'volvías', 'volvía', 'volvíamos', 'volvíais', 'volvían'],
  },
  jugar: {
    presente: ['juego', 'juegas', 'juega', 'jugamos', 'jugáis', 'juegan'],
    indefinido: ['jugué', 'jugaste', 'jugó', 'jugamos', 'jugasteis', 'jugaron'],
    imperfecto: ['jugaba', 'jugabas', 'jugaba', 'jugábamos', 'jugabais', 'jugaban'],
  },
  pedir: {
    presente: ['pido', 'pides', 'pide', 'pedimos', 'pedís', 'piden'],
    indefinido: ['pedí', 'pediste', 'pidió', 'pedimos', 'pedisteis', 'pidieron'],
    imperfecto: ['pedía', 'pedías', 'pedía', 'pedíamos', 'pedíais', 'pedían'],
  },
  servir: {
    presente: ['sirvo', 'sirves', 'sirve', 'servimos', 'servís', 'sirven'],
    indefinido: ['serví', 'serviste', 'sirvió', 'servimos', 'servisteis', 'sirvieron'],
    imperfecto: ['servía', 'servías', 'servía', 'servíamos', 'servíais', 'servían'],
  },
  dormir: {
    presente: ['duermo', 'duermes', 'duerme', 'dormimos', 'dormís', 'duermen'],
    indefinido: ['dormí', 'dormiste', 'durmió', 'dormimos', 'dormisteis', 'durmieron'],
    imperfecto: ['dormía', 'dormías', 'dormía', 'dormíamos', 'dormíais', 'dormían'],
  },
  preferir: {
    presente: ['prefiero', 'prefieres', 'prefiere', 'preferimos', 'preferís', 'prefieren'],
    indefinido: ['preferí', 'preferiste', 'prefirió', 'preferimos', 'preferisteis', 'prefirieron'],
    imperfecto: ['prefería', 'preferías', 'prefería', 'preferíamos', 'preferíais', 'preferían'],
  },
  sentir: {
    presente: ['siento', 'sientes', 'siente', 'sentimos', 'sentís', 'sienten'],
    indefinido: ['sentí', 'sentiste', 'sintió', 'sentimos', 'sentisteis', 'sintieron'],
    imperfecto: ['sentía', 'sentías', 'sentía', 'sentíamos', 'sentíais', 'sentían'],
  },
  ser: {
    presente: ['soy', 'eres', 'es', 'somos', 'sois', 'son'],
    indefinido: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
    imperfecto: ['era', 'eras', 'era', 'éramos', 'erais', 'eran'],
  },
  estar: {
    presente: ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'],
    indefinido: ['estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron'],
    imperfecto: ['estaba', 'estabas', 'estaba', 'estábamos', 'estabais', 'estaban'],
  },
  ir: {
    presente: ['voy', 'vas', 'va', 'vamos', 'vais', 'van'],
    indefinido: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
    imperfecto: ['iba', 'ibas', 'iba', 'íbamos', 'ibais', 'iban'],
  },
  haber: {
    presente: ['he', 'has', 'ha', 'hemos', 'habéis', 'han'],
    indefinido: ['hube', 'hubiste', 'hubo', 'hubimos', 'hubisteis', 'hubieron'],
    imperfecto: ['había', 'habías', 'había', 'habíamos', 'habíais', 'habían'],
  },
  tener: {
    presente: ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen'],
    indefinido: ['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron'],
    imperfecto: ['tenía', 'tenías', 'tenía', 'teníamos', 'teníais', 'tenían'],
  },
  hacer: {
    presente: ['hago', 'haces', 'hace', 'hacemos', 'hacéis', 'hacen'],
    indefinido: ['hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron'],
    imperfecto: ['hacía', 'hacías', 'hacía', 'hacíamos', 'hacíais', 'hacían'],
  },
  poder: {
    presente: ['puedo', 'puedes', 'puede', 'podemos', 'podéis', 'pueden'],
    indefinido: ['pude', 'pudiste', 'pudo', 'pudimos', 'pudisteis', 'pudieron'],
    imperfecto: ['podía', 'podías', 'podía', 'podíamos', 'podíais', 'podían'],
  },
  decir: {
    presente: ['digo', 'dices', 'dice', 'decimos', 'decís', 'dicen'],
    indefinido: ['dije', 'dijiste', 'dijo', 'dijimos', 'dijisteis', 'dijeron'],
    imperfecto: ['decía', 'decías', 'decía', 'decíamos', 'decíais', 'decían'],
  },
  venir: {
    presente: ['vengo', 'vienes', 'viene', 'venimos', 'venís', 'vienen'],
    indefinido: ['vine', 'viniste', 'vino', 'vinimos', 'vinisteis', 'vinieron'],
    imperfecto: ['venía', 'venías', 'venía', 'veníamos', 'veníais', 'venían'],
  },
  querer: {
    presente: ['quiero', 'quieres', 'quiere', 'queremos', 'queréis', 'quieren'],
    indefinido: ['quise', 'quisiste', 'quiso', 'quisimos', 'quisisteis', 'quisieron'],
    imperfecto: ['quería', 'querías', 'quería', 'queríamos', 'queríais', 'querían'],
  },
  saber: {
    presente: ['sé', 'sabes', 'sabe', 'sabemos', 'sabéis', 'saben'],
    indefinido: ['supe', 'supiste', 'supo', 'supimos', 'supisteis', 'supieron'],
    imperfecto: ['sabía', 'sabías', 'sabía', 'sabíamos', 'sabíais', 'sabían'],
  },
  poner: {
    presente: ['pongo', 'pones', 'pone', 'ponemos', 'ponéis', 'ponen'],
    indefinido: ['puse', 'pusiste', 'puso', 'pusimos', 'pusisteis', 'pusieron'],
    imperfecto: ['ponía', 'ponías', 'ponía', 'poníamos', 'poníais', 'ponían'],
  },
  ver: {
    presente: ['veo', 'ves', 've', 'vemos', 'veis', 'ven'],
    indefinido: ['vi', 'viste', 'vio', 'vimos', 'visteis', 'vieron'],
    imperfecto: ['veía', 'veías', 'veía', 'veíamos', 'veíais', 'veían'],
  },
  dar: {
    presente: ['doy', 'das', 'da', 'damos', 'dais', 'dan'],
    indefinido: ['di', 'diste', 'dio', 'dimos', 'disteis', 'dieron'],
    imperfecto: ['daba', 'dabas', 'daba', 'dábamos', 'dabais', 'daban'],
  },
  salir: {
    presente: ['salgo', 'sales', 'sale', 'salimos', 'salís', 'salen'],
    indefinido: ['salí', 'saliste', 'salió', 'salimos', 'salisteis', 'salieron'],
    imperfecto: ['salía', 'salías', 'salía', 'salíamos', 'salíais', 'salían'],
  },
  traer: {
    presente: ['traigo', 'traes', 'trae', 'traemos', 'traéis', 'traen'],
    indefinido: ['traje', 'trajiste', 'trajo', 'trajimos', 'trajisteis', 'trajeron'],
    imperfecto: ['traía', 'traías', 'traía', 'traíamos', 'traíais', 'traían'],
  },
  conocer: {
    presente: ['conozco', 'conoces', 'conoce', 'conocemos', 'conocéis', 'conocen'],
    indefinido: ['conocí', 'conociste', 'conoció', 'conocimos', 'conocisteis', 'conocieron'],
    imperfecto: ['conocía', 'conocías', 'conocía', 'conocíamos', 'conocíais', 'conocían'],
  },
  parecer: {
    presente: ['parezco', 'pareces', 'parece', 'parecemos', 'parecéis', 'parecen'],
    indefinido: ['parecí', 'pareciste', 'pareció', 'parecimos', 'parecisteis', 'parecieron'],
    imperfecto: ['parecía', 'parecías', 'parecía', 'parecíamos', 'parecíais', 'parecían'],
  },
  leer: {
    presente: ['leo', 'lees', 'lee', 'leemos', 'leéis', 'leen'],
    indefinido: ['leí', 'leíste', 'leyó', 'leímos', 'leísteis', 'leyeron'],
    imperfecto: ['leía', 'leías', 'leía', 'leíamos', 'leíais', 'leían'],
  },
  oír: {
    presente: ['oigo', 'oyes', 'oye', 'oímos', 'oís', 'oyen'],
    indefinido: ['oí', 'oíste', 'oyó', 'oímos', 'oísteis', 'oyeron'],
    imperfecto: ['oía', 'oías', 'oía', 'oíamos', 'oíais', 'oían'],
  },
  caer: {
    presente: ['caigo', 'caes', 'cae', 'caemos', 'caéis', 'caen'],
    indefinido: ['caí', 'caíste', 'cayó', 'caímos', 'caísteis', 'cayeron'],
    imperfecto: ['caía', 'caías', 'caía', 'caíamos', 'caíais', 'caían'],
  },
}

describe('conjugate — эталон для всего банка', () => {
  it('каждый глагол банка есть в эталоне, и наоборот', () => {
    expect(Object.keys(EXPECTED).sort()).toEqual(VERBS.map((v) => v.infinitive).sort())
  })

  for (const verb of VERBS) {
    for (const tense of TENSES) {
      it(`${verb.infinitive} · ${tense}`, () => {
        const actual = PERSONS.map((p) => conjugate(verb, tense, p))
        expect(actual).toEqual(EXPECTED[verb.infinitive]![tense])
      })
    }
  }
})
