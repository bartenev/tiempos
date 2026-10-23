import { describe, expect, it } from 'vitest'
import { VERBS } from '../data/verbs'
import type { Tense } from '../types'
import { TENSES, personsFor } from '../types'
import { conjugate, hasTense } from './conjugate'

/**
 * Эталон: все формы всех глаголов банка, проверенные вручную.
 * Порядок лиц: yo, tú, él, nosotros, vosotros, ellos;
 * imperativo: tú, usted, nosotros, vosotros, ustedes.
 * Новый глагол в банке → добавить сюда его проверенные формы.
 */
const EXPECTED: Record<string, Partial<Record<Tense, string[]>>> = {
  hablar: {
    presente: ['hablo', 'hablas', 'habla', 'hablamos', 'habláis', 'hablan'],
    indefinido: ['hablé', 'hablaste', 'habló', 'hablamos', 'hablasteis', 'hablaron'],
    imperfecto: ['hablaba', 'hablabas', 'hablaba', 'hablábamos', 'hablabais', 'hablaban'],
    imperativo: ['habla', 'hable', 'hablemos', 'hablad', 'hablen'],
  },
  estudiar: {
    presente: ['estudio', 'estudias', 'estudia', 'estudiamos', 'estudiáis', 'estudian'],
    indefinido: ['estudié', 'estudiaste', 'estudió', 'estudiamos', 'estudiasteis', 'estudiaron'],
    imperfecto: ['estudiaba', 'estudiabas', 'estudiaba', 'estudiábamos', 'estudiabais', 'estudiaban'],
    imperativo: ['estudia', 'estudie', 'estudiemos', 'estudiad', 'estudien'],
  },
  trabajar: {
    presente: ['trabajo', 'trabajas', 'trabaja', 'trabajamos', 'trabajáis', 'trabajan'],
    indefinido: ['trabajé', 'trabajaste', 'trabajó', 'trabajamos', 'trabajasteis', 'trabajaron'],
    imperfecto: ['trabajaba', 'trabajabas', 'trabajaba', 'trabajábamos', 'trabajabais', 'trabajaban'],
    imperativo: ['trabaja', 'trabaje', 'trabajemos', 'trabajad', 'trabajen'],
  },
  caminar: {
    presente: ['camino', 'caminas', 'camina', 'caminamos', 'camináis', 'caminan'],
    indefinido: ['caminé', 'caminaste', 'caminó', 'caminamos', 'caminasteis', 'caminaron'],
    imperfecto: ['caminaba', 'caminabas', 'caminaba', 'caminábamos', 'caminabais', 'caminaban'],
    imperativo: ['camina', 'camine', 'caminemos', 'caminad', 'caminen'],
  },
  comprar: {
    presente: ['compro', 'compras', 'compra', 'compramos', 'compráis', 'compran'],
    indefinido: ['compré', 'compraste', 'compró', 'compramos', 'comprasteis', 'compraron'],
    imperfecto: ['compraba', 'comprabas', 'compraba', 'comprábamos', 'comprabais', 'compraban'],
    imperativo: ['compra', 'compre', 'compremos', 'comprad', 'compren'],
  },
  mirar: {
    presente: ['miro', 'miras', 'mira', 'miramos', 'miráis', 'miran'],
    indefinido: ['miré', 'miraste', 'miró', 'miramos', 'mirasteis', 'miraron'],
    imperfecto: ['miraba', 'mirabas', 'miraba', 'mirábamos', 'mirabais', 'miraban'],
    imperativo: ['mira', 'mire', 'miremos', 'mirad', 'miren'],
  },
  escuchar: {
    presente: ['escucho', 'escuchas', 'escucha', 'escuchamos', 'escucháis', 'escuchan'],
    indefinido: ['escuché', 'escuchaste', 'escuchó', 'escuchamos', 'escuchasteis', 'escucharon'],
    imperfecto: ['escuchaba', 'escuchabas', 'escuchaba', 'escuchábamos', 'escuchabais', 'escuchaban'],
    imperativo: ['escucha', 'escuche', 'escuchemos', 'escuchad', 'escuchen'],
  },
  cantar: {
    presente: ['canto', 'cantas', 'canta', 'cantamos', 'cantáis', 'cantan'],
    indefinido: ['canté', 'cantaste', 'cantó', 'cantamos', 'cantasteis', 'cantaron'],
    imperfecto: ['cantaba', 'cantabas', 'cantaba', 'cantábamos', 'cantabais', 'cantaban'],
    imperativo: ['canta', 'cante', 'cantemos', 'cantad', 'canten'],
  },
  bailar: {
    presente: ['bailo', 'bailas', 'baila', 'bailamos', 'bailáis', 'bailan'],
    indefinido: ['bailé', 'bailaste', 'bailó', 'bailamos', 'bailasteis', 'bailaron'],
    imperfecto: ['bailaba', 'bailabas', 'bailaba', 'bailábamos', 'bailabais', 'bailaban'],
    imperativo: ['baila', 'baile', 'bailemos', 'bailad', 'bailen'],
  },
  cocinar: {
    presente: ['cocino', 'cocinas', 'cocina', 'cocinamos', 'cocináis', 'cocinan'],
    indefinido: ['cociné', 'cocinaste', 'cocinó', 'cocinamos', 'cocinasteis', 'cocinaron'],
    imperfecto: ['cocinaba', 'cocinabas', 'cocinaba', 'cocinábamos', 'cocinabais', 'cocinaban'],
    imperativo: ['cocina', 'cocine', 'cocinemos', 'cocinad', 'cocinen'],
  },
  llegar: {
    presente: ['llego', 'llegas', 'llega', 'llegamos', 'llegáis', 'llegan'],
    indefinido: ['llegué', 'llegaste', 'llegó', 'llegamos', 'llegasteis', 'llegaron'],
    imperfecto: ['llegaba', 'llegabas', 'llegaba', 'llegábamos', 'llegabais', 'llegaban'],
    imperativo: ['llega', 'llegue', 'lleguemos', 'llegad', 'lleguen'],
  },
  buscar: {
    presente: ['busco', 'buscas', 'busca', 'buscamos', 'buscáis', 'buscan'],
    indefinido: ['busqué', 'buscaste', 'buscó', 'buscamos', 'buscasteis', 'buscaron'],
    imperfecto: ['buscaba', 'buscabas', 'buscaba', 'buscábamos', 'buscabais', 'buscaban'],
    imperativo: ['busca', 'busque', 'busquemos', 'buscad', 'busquen'],
  },
  tomar: {
    presente: ['tomo', 'tomas', 'toma', 'tomamos', 'tomáis', 'toman'],
    indefinido: ['tomé', 'tomaste', 'tomó', 'tomamos', 'tomasteis', 'tomaron'],
    imperfecto: ['tomaba', 'tomabas', 'tomaba', 'tomábamos', 'tomabais', 'tomaban'],
    imperativo: ['toma', 'tome', 'tomemos', 'tomad', 'tomen'],
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
    imperativo: ['come', 'coma', 'comamos', 'comed', 'coman'],
  },
  beber: {
    presente: ['bebo', 'bebes', 'bebe', 'bebemos', 'bebéis', 'beben'],
    indefinido: ['bebí', 'bebiste', 'bebió', 'bebimos', 'bebisteis', 'bebieron'],
    imperfecto: ['bebía', 'bebías', 'bebía', 'bebíamos', 'bebíais', 'bebían'],
    imperativo: ['bebe', 'beba', 'bebamos', 'bebed', 'beban'],
  },
  correr: {
    presente: ['corro', 'corres', 'corre', 'corremos', 'corréis', 'corren'],
    indefinido: ['corrí', 'corriste', 'corrió', 'corrimos', 'corristeis', 'corrieron'],
    imperfecto: ['corría', 'corrías', 'corría', 'corríamos', 'corríais', 'corrían'],
    imperativo: ['corre', 'corra', 'corramos', 'corred', 'corran'],
  },
  aprender: {
    presente: ['aprendo', 'aprendes', 'aprende', 'aprendemos', 'aprendéis', 'aprenden'],
    indefinido: ['aprendí', 'aprendiste', 'aprendió', 'aprendimos', 'aprendisteis', 'aprendieron'],
    imperfecto: ['aprendía', 'aprendías', 'aprendía', 'aprendíamos', 'aprendíais', 'aprendían'],
    imperativo: ['aprende', 'aprenda', 'aprendamos', 'aprended', 'aprendan'],
  },
  comprender: {
    presente: ['comprendo', 'comprendes', 'comprende', 'comprendemos', 'comprendéis', 'comprenden'],
    indefinido: ['comprendí', 'comprendiste', 'comprendió', 'comprendimos', 'comprendisteis', 'comprendieron'],
    imperfecto: ['comprendía', 'comprendías', 'comprendía', 'comprendíamos', 'comprendíais', 'comprendían'],
    imperativo: ['comprende', 'comprenda', 'comprendamos', 'comprended', 'comprendan'],
  },
  vender: {
    presente: ['vendo', 'vendes', 'vende', 'vendemos', 'vendéis', 'venden'],
    indefinido: ['vendí', 'vendiste', 'vendió', 'vendimos', 'vendisteis', 'vendieron'],
    imperfecto: ['vendía', 'vendías', 'vendía', 'vendíamos', 'vendíais', 'vendían'],
    imperativo: ['vende', 'venda', 'vendamos', 'vended', 'vendan'],
  },
  responder: {
    presente: ['respondo', 'respondes', 'responde', 'respondemos', 'respondéis', 'responden'],
    indefinido: ['respondí', 'respondiste', 'respondió', 'respondimos', 'respondisteis', 'respondieron'],
    imperfecto: ['respondía', 'respondías', 'respondía', 'respondíamos', 'respondíais', 'respondían'],
    imperativo: ['responde', 'responda', 'respondamos', 'responded', 'respondan'],
  },
  vivir: {
    presente: ['vivo', 'vives', 'vive', 'vivimos', 'vivís', 'viven'],
    indefinido: ['viví', 'viviste', 'vivió', 'vivimos', 'vivisteis', 'vivieron'],
    imperfecto: ['vivía', 'vivías', 'vivía', 'vivíamos', 'vivíais', 'vivían'],
    imperativo: ['vive', 'viva', 'vivamos', 'vivid', 'vivan'],
  },
  escribir: {
    presente: ['escribo', 'escribes', 'escribe', 'escribimos', 'escribís', 'escriben'],
    indefinido: ['escribí', 'escribiste', 'escribió', 'escribimos', 'escribisteis', 'escribieron'],
    imperfecto: ['escribía', 'escribías', 'escribía', 'escribíamos', 'escribíais', 'escribían'],
    imperativo: ['escribe', 'escriba', 'escribamos', 'escribid', 'escriban'],
  },
  abrir: {
    presente: ['abro', 'abres', 'abre', 'abrimos', 'abrís', 'abren'],
    indefinido: ['abrí', 'abriste', 'abrió', 'abrimos', 'abristeis', 'abrieron'],
    imperfecto: ['abría', 'abrías', 'abría', 'abríamos', 'abríais', 'abrían'],
    imperativo: ['abre', 'abra', 'abramos', 'abrid', 'abran'],
  },
  subir: {
    presente: ['subo', 'subes', 'sube', 'subimos', 'subís', 'suben'],
    indefinido: ['subí', 'subiste', 'subió', 'subimos', 'subisteis', 'subieron'],
    imperfecto: ['subía', 'subías', 'subía', 'subíamos', 'subíais', 'subían'],
    imperativo: ['sube', 'suba', 'subamos', 'subid', 'suban'],
  },
  decidir: {
    presente: ['decido', 'decides', 'decide', 'decidimos', 'decidís', 'deciden'],
    indefinido: ['decidí', 'decidiste', 'decidió', 'decidimos', 'decidisteis', 'decidieron'],
    imperfecto: ['decidía', 'decidías', 'decidía', 'decidíamos', 'decidíais', 'decidían'],
    imperativo: ['decide', 'decida', 'decidamos', 'decidid', 'decidan'],
  },
  recibir: {
    presente: ['recibo', 'recibes', 'recibe', 'recibimos', 'recibís', 'reciben'],
    indefinido: ['recibí', 'recibiste', 'recibió', 'recibimos', 'recibisteis', 'recibieron'],
    imperfecto: ['recibía', 'recibías', 'recibía', 'recibíamos', 'recibíais', 'recibían'],
    imperativo: ['recibe', 'reciba', 'recibamos', 'recibid', 'reciban'],
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
    imperativo: ['piensa', 'piense', 'pensemos', 'pensad', 'piensen'],
  },
  empezar: {
    presente: ['empiezo', 'empiezas', 'empieza', 'empezamos', 'empezáis', 'empiezan'],
    indefinido: ['empecé', 'empezaste', 'empezó', 'empezamos', 'empezasteis', 'empezaron'],
    imperfecto: ['empezaba', 'empezabas', 'empezaba', 'empezábamos', 'empezabais', 'empezaban'],
    imperativo: ['empieza', 'empiece', 'empecemos', 'empezad', 'empiecen'],
  },
  encontrar: {
    presente: ['encuentro', 'encuentras', 'encuentra', 'encontramos', 'encontráis', 'encuentran'],
    indefinido: ['encontré', 'encontraste', 'encontró', 'encontramos', 'encontrasteis', 'encontraron'],
    imperfecto: ['encontraba', 'encontrabas', 'encontraba', 'encontrábamos', 'encontrabais', 'encontraban'],
    imperativo: ['encuentra', 'encuentre', 'encontremos', 'encontrad', 'encuentren'],
  },
  volver: {
    presente: ['vuelvo', 'vuelves', 'vuelve', 'volvemos', 'volvéis', 'vuelven'],
    indefinido: ['volví', 'volviste', 'volvió', 'volvimos', 'volvisteis', 'volvieron'],
    imperfecto: ['volvía', 'volvías', 'volvía', 'volvíamos', 'volvíais', 'volvían'],
    imperativo: ['vuelve', 'vuelva', 'volvamos', 'volved', 'vuelvan'],
  },
  jugar: {
    presente: ['juego', 'juegas', 'juega', 'jugamos', 'jugáis', 'juegan'],
    indefinido: ['jugué', 'jugaste', 'jugó', 'jugamos', 'jugasteis', 'jugaron'],
    imperfecto: ['jugaba', 'jugabas', 'jugaba', 'jugábamos', 'jugabais', 'jugaban'],
    imperativo: ['juega', 'juegue', 'juguemos', 'jugad', 'jueguen'],
  },
  pedir: {
    presente: ['pido', 'pides', 'pide', 'pedimos', 'pedís', 'piden'],
    indefinido: ['pedí', 'pediste', 'pidió', 'pedimos', 'pedisteis', 'pidieron'],
    imperfecto: ['pedía', 'pedías', 'pedía', 'pedíamos', 'pedíais', 'pedían'],
    imperativo: ['pide', 'pida', 'pidamos', 'pedid', 'pidan'],
  },
  servir: {
    presente: ['sirvo', 'sirves', 'sirve', 'servimos', 'servís', 'sirven'],
    indefinido: ['serví', 'serviste', 'sirvió', 'servimos', 'servisteis', 'sirvieron'],
    imperfecto: ['servía', 'servías', 'servía', 'servíamos', 'servíais', 'servían'],
    imperativo: ['sirve', 'sirva', 'sirvamos', 'servid', 'sirvan'],
  },
  dormir: {
    presente: ['duermo', 'duermes', 'duerme', 'dormimos', 'dormís', 'duermen'],
    indefinido: ['dormí', 'dormiste', 'durmió', 'dormimos', 'dormisteis', 'durmieron'],
    imperfecto: ['dormía', 'dormías', 'dormía', 'dormíamos', 'dormíais', 'dormían'],
    imperativo: ['duerme', 'duerma', 'durmamos', 'dormid', 'duerman'],
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
    imperativo: ['sé', 'sea', 'seamos', 'sed', 'sean'],
  },
  estar: {
    presente: ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'],
    indefinido: ['estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron'],
    imperfecto: ['estaba', 'estabas', 'estaba', 'estábamos', 'estabais', 'estaban'],
    imperativo: ['está', 'esté', 'estemos', 'estad', 'estén'],
  },
  ir: {
    presente: ['voy', 'vas', 'va', 'vamos', 'vais', 'van'],
    indefinido: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
    imperfecto: ['iba', 'ibas', 'iba', 'íbamos', 'ibais', 'iban'],
    imperativo: ['ve', 'vaya', 'vamos', 'id', 'vayan'],
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
    imperativo: ['ten', 'tenga', 'tengamos', 'tened', 'tengan'],
  },
  hacer: {
    presente: ['hago', 'haces', 'hace', 'hacemos', 'hacéis', 'hacen'],
    indefinido: ['hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron'],
    imperfecto: ['hacía', 'hacías', 'hacía', 'hacíamos', 'hacíais', 'hacían'],
    imperativo: ['haz', 'haga', 'hagamos', 'haced', 'hagan'],
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
    imperativo: ['di', 'diga', 'digamos', 'decid', 'digan'],
  },
  venir: {
    presente: ['vengo', 'vienes', 'viene', 'venimos', 'venís', 'vienen'],
    indefinido: ['vine', 'viniste', 'vino', 'vinimos', 'vinisteis', 'vinieron'],
    imperfecto: ['venía', 'venías', 'venía', 'veníamos', 'veníais', 'venían'],
    imperativo: ['ven', 'venga', 'vengamos', 'venid', 'vengan'],
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
    imperativo: ['pon', 'ponga', 'pongamos', 'poned', 'pongan'],
  },
  ver: {
    presente: ['veo', 'ves', 've', 'vemos', 'veis', 'ven'],
    indefinido: ['vi', 'viste', 'vio', 'vimos', 'visteis', 'vieron'],
    imperfecto: ['veía', 'veías', 'veía', 'veíamos', 'veíais', 'veían'],
    imperativo: ['ve', 'vea', 'veamos', 'ved', 'vean'],
  },
  dar: {
    presente: ['doy', 'das', 'da', 'damos', 'dais', 'dan'],
    indefinido: ['di', 'diste', 'dio', 'dimos', 'disteis', 'dieron'],
    imperfecto: ['daba', 'dabas', 'daba', 'dábamos', 'dabais', 'daban'],
    imperativo: ['da', 'dé', 'demos', 'dad', 'den'],
  },
  salir: {
    presente: ['salgo', 'sales', 'sale', 'salimos', 'salís', 'salen'],
    indefinido: ['salí', 'saliste', 'salió', 'salimos', 'salisteis', 'salieron'],
    imperfecto: ['salía', 'salías', 'salía', 'salíamos', 'salíais', 'salían'],
    imperativo: ['sal', 'salga', 'salgamos', 'salid', 'salgan'],
  },
  traer: {
    presente: ['traigo', 'traes', 'trae', 'traemos', 'traéis', 'traen'],
    indefinido: ['traje', 'trajiste', 'trajo', 'trajimos', 'trajisteis', 'trajeron'],
    imperfecto: ['traía', 'traías', 'traía', 'traíamos', 'traíais', 'traían'],
    imperativo: ['trae', 'traiga', 'traigamos', 'traed', 'traigan'],
  },
  conocer: {
    presente: ['conozco', 'conoces', 'conoce', 'conocemos', 'conocéis', 'conocen'],
    indefinido: ['conocí', 'conociste', 'conoció', 'conocimos', 'conocisteis', 'conocieron'],
    imperfecto: ['conocía', 'conocías', 'conocía', 'conocíamos', 'conocíais', 'conocían'],
    imperativo: ['conoce', 'conozca', 'conozcamos', 'conoced', 'conozcan'],
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
    imperativo: ['lee', 'lea', 'leamos', 'leed', 'lean'],
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
        const expected = EXPECTED[verb.infinitive]![tense]
        if (!hasTense(verb, tense)) {
          expect(expected, 'у глагола нет этого времени').toBeUndefined()
          return
        }
        const actual = personsFor(tense).map((p) => conjugate(verb, tense, p))
        expect(actual).toEqual(expected)
      })
    }
  }
})
