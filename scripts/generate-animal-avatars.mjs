import { mkdir, writeFile } from 'node:fs/promises';

// Original ArcTalent portraits. Shared geometry keeps them legible at avatar size.
const ink = '#514052';
const eyes = (y = 66, left = 49, right = 79) =>
  '<g stroke="none">' +
  [left, right]
    .map(
      (x) =>
        '<circle cx="' +
        x +
        '" cy="' +
        y +
        '" r="4.4" fill="#332937"/><circle cx="' +
        (x - 1.3) +
        '" cy="' +
        (y - 1.5) +
        '" r="1.4" fill="#fff"/>',
    )
    .join('') +
  '</g>';
const cheeks = (y = 79) =>
  '<g fill="#ed9da9" stroke="none" opacity=".65"><ellipse cx="36" cy="' +
  y +
  '" rx="7" ry="4"/><ellipse cx="92" cy="' +
  y +
  '" rx="7" ry="4"/></g>';
const smile = (y = 80) =>
  '<path d="M57 ' +
  y +
  'q7 9 14 0" fill="none" stroke="' +
  ink +
  '" stroke-width="2.5"/>';
const petFace = (nose = '#b77d86') =>
  eyes() +
  cheeks() +
  '<path d="M60 76q4-3 8 0l-4 4Z" fill="' +
  nose +
  '" stroke="none"/><path d="M64 80v3m-9 0q4 7 9 0 5 7 9 0" fill="none" stroke="' +
  ink +
  '" stroke-width="2.2"/>';
const body = (fur, belly = '#fff4df') =>
  '<ellipse cx="64" cy="121" rx="35" ry="27" fill="' +
  fur +
  '"/><ellipse cx="64" cy="123" rx="20" ry="19" fill="' +
  belly +
  '" stroke="none"/>';

const portraits = [
  {
    id: 'cat',
    title: 'Cat avatar',
    background: '#e6ddfa',
    art:
      body('#c9b5e7', '#f8efff') +
      '<path d="M27 54 25 19q19 0 28 20h22q11-20 29-20l-3 36" fill="#c9b5e7"/><path d="m33 41-1-13 13 13m38 0 13-13-1 13" fill="#eea8bc" stroke="none"/><ellipse cx="64" cy="68" rx="40" ry="34" fill="#e8daf8"/><path d="m58 36 6 12 6-12" fill="#b198d0" stroke="none"/><path d="m28 76-13-3m13 9-12 3m84-9 13-3m-13 9 12 3" fill="none" stroke-width="2"/>' +
      petFace(),
  },
  {
    id: 'puppy',
    title: 'Puppy avatar',
    background: '#d6eee5',
    art:
      body('#d8a56f') +
      '<ellipse cx="29" cy="64" rx="14" ry="28" transform="rotate(16 29 64)" fill="#aa744f"/><ellipse cx="99" cy="64" rx="14" ry="28" transform="rotate(-16 99 64)" fill="#aa744f"/><ellipse cx="64" cy="65" rx="35" ry="36" fill="#f0cb96"/><ellipse cx="46" cy="62" rx="13" ry="16" fill="#c58d61" stroke="none"/>' +
      eyes() +
      cheeks() +
      '<ellipse cx="64" cy="79" rx="8" ry="5.5" fill="#514052" stroke="none"/><path d="M64 84v2m-8 0q8 9 16 0" fill="none"/><path d="M61 31q-4-8 5-11" fill="none"/>',
  },
  {
    id: 'bunny',
    title: 'Bunny avatar',
    background: '#f9dfe9',
    art:
      body('#fff6ed', '#f5d9e5') +
      '<ellipse cx="43" cy="34" rx="12" ry="29" transform="rotate(-9 43 34)" fill="#fff6ed"/><ellipse cx="85" cy="34" rx="12" ry="29" transform="rotate(9 85 34)" fill="#fff6ed"/><ellipse cx="43" cy="33" rx="5.5" ry="20" transform="rotate(-9 43 33)" fill="#efb2c8" stroke="none"/><ellipse cx="85" cy="33" rx="5.5" ry="20" transform="rotate(9 85 33)" fill="#efb2c8" stroke="none"/><ellipse cx="64" cy="76" rx="39" ry="32" fill="#fff6ed"/>' +
      petFace('#db91ab'),
  },
  {
    id: 'fox',
    title: 'Fox avatar',
    background: '#fce6ce',
    art:
      body('#dc8b57', '#fff5e7') +
      '<path d="m27 54-5-36q21 1 32 20h20q12-20 32-20l-5 36" fill="#dc8b57"/><path d="m31 38-1-11 14 13m40 0 14-13-1 11" fill="#7f555c" stroke="none"/><ellipse cx="64" cy="67" rx="40" ry="36" fill="#e9a067"/><path d="M25 65q18 1 39 23 21-22 39-23-1 35-39 39-38-4-39-39Z" fill="#fff4df" stroke="none"/>' +
      eyes() +
      cheeks() +
      '<path d="M59 82q5-4 10 0l-5 6Z" fill="#514052" stroke="none"/>' +
      smile(89),
  },
  {
    id: 'panda',
    title: 'Panda avatar',
    background: '#dcebdc',
    art:
      body('#514a59', '#fff8ee') +
      '<circle cx="31" cy="37" r="15" fill="#514a59"/><circle cx="97" cy="37" r="15" fill="#514a59"/><ellipse cx="64" cy="68" rx="42" ry="37" fill="#fff8ee"/><ellipse cx="47" cy="65" rx="11" ry="14" transform="rotate(16 47 65)" fill="#514a59" stroke="none"/><ellipse cx="81" cy="65" rx="11" ry="14" transform="rotate(-16 81 65)" fill="#514a59" stroke="none"/>' +
      eyes(65, 47, 81) +
      cheeks(82) +
      '<ellipse cx="64" cy="81" rx="5" ry="3.5" fill="#514a59" stroke="none"/>' +
      smile(88),
  },
  {
    id: 'bear',
    title: 'Bear avatar',
    background: '#f4e3cc',
    art:
      body('#bf8d6a', '#f4d7b1') +
      '<circle cx="32" cy="37" r="14" fill="#bf8d6a"/><circle cx="96" cy="37" r="14" fill="#bf8d6a"/><circle cx="32" cy="37" r="7" fill="#e9bd9b" stroke="none"/><circle cx="96" cy="37" r="7" fill="#e9bd9b" stroke="none"/><ellipse cx="64" cy="69" rx="41" ry="36" fill="#cf9d76"/><ellipse cx="64" cy="82" rx="18" ry="14" fill="#f4d7b1" stroke="none"/>' +
      eyes() +
      cheeks() +
      '<ellipse cx="64" cy="78" rx="6" ry="4" fill="#514052" stroke="none"/>' +
      smile(85),
  },
  {
    id: 'koala',
    title: 'Koala avatar',
    background: '#dce7f4',
    art:
      body('#aebdce', '#edf1f5') +
      '<circle cx="24" cy="51" r="21" fill="#aebdce"/><circle cx="104" cy="51" r="21" fill="#aebdce"/><circle cx="24" cy="51" r="13" fill="#f5e6e7" stroke="none"/><circle cx="104" cy="51" r="13" fill="#f5e6e7" stroke="none"/><ellipse cx="64" cy="70" rx="37" ry="36" fill="#bdcad8"/>' +
      eyes(64, 45, 83) +
      cheeks(82) +
      '<rect x="56" y="67" width="16" height="22" rx="8" fill="#615869" stroke="none"/>' +
      smile(92),
  },
  {
    id: 'otter',
    title: 'Otter avatar',
    background: '#e0efe9',
    art:
      body('#ae8066', '#f6ddba') +
      '<circle cx="30" cy="44" r="11" fill="#ae8066"/><circle cx="98" cy="44" r="11" fill="#ae8066"/><ellipse cx="64" cy="67" rx="39" ry="35" fill="#c09676"/><ellipse cx="64" cy="80" rx="27" ry="18" fill="#f6ddba" stroke="none"/>' +
      eyes() +
      cheeks() +
      '<ellipse cx="64" cy="77" rx="6" ry="4" fill="#514052" stroke="none"/>' +
      smile(85) +
      '<path d="M64 124 46 108c-11-13 7-24 18-11 11-13 29-2 18 11Z" fill="#e49dab"/><ellipse cx="40" cy="110" rx="10" ry="7" transform="rotate(27 40 110)" fill="#c09676"/><ellipse cx="88" cy="110" rx="10" ry="7" transform="rotate(-27 88 110)" fill="#c09676"/>',
  },
  {
    id: 'capybara',
    title: 'Capybara avatar',
    background: '#e9e9cb',
    art:
      body('#c4a17c', '#ebcfab') +
      '<circle cx="34" cy="42" r="10" fill="#b28d6e"/><circle cx="94" cy="42" r="10" fill="#b28d6e"/><rect x="23" y="37" width="82" height="68" rx="30" fill="#cba783"/><ellipse cx="67" cy="83" rx="27" ry="16" fill="#dfbd94" stroke="none"/>' +
      eyes(66, 46, 82) +
      '<path d="M58 79h17m-13 9q7 5 13-1" fill="none"/><path d="M56 81v3m14-3v3" fill="none" stroke-width="2"/><circle cx="65" cy="30" r="12" fill="#ecaa60"/><path d="M65 18q5-12 13-5-3 8-13 5Z" fill="#8fa77b" stroke="none"/>',
  },
  {
    id: 'penguin',
    title: 'Penguin avatar',
    background: '#daeaf7',
    art:
      '<path d="M33 74Q4 89 16 106l23-9m56-23q29 15 17 32L89 97" fill="#65748d"/><ellipse cx="64" cy="76" rx="39" ry="48" fill="#65748d"/><ellipse cx="64" cy="88" rx="27" ry="34" fill="#fff9ec" stroke="none"/><ellipse cx="51" cy="63" rx="20" ry="26" fill="#fff9ec" stroke="none"/><ellipse cx="77" cy="63" rx="20" ry="26" fill="#fff9ec" stroke="none"/>' +
      eyes(62, 50, 78) +
      cheeks(77) +
      '<path d="m57 77 7 8 7-8q-7-7-14 0Z" fill="#eeb978"/><ellipse cx="44" cy="122" rx="13" ry="6" fill="#eeb978"/><ellipse cx="84" cy="122" rx="13" ry="6" fill="#eeb978"/>',
  },
  {
    id: 'owl',
    title: 'Owl avatar',
    background: '#e9dff3',
    art:
      '<ellipse cx="64" cy="80" rx="41" ry="47" fill="#b68b76"/><path d="m24 57-3-36 28 14q15-6 30 0l28-14-3 36" fill="#b68b76"/><ellipse cx="46" cy="65" rx="23" ry="26" fill="#f7e4c7" stroke="none"/><ellipse cx="82" cy="65" rx="23" ry="26" fill="#f7e4c7" stroke="none"/>' +
      eyes(64, 46, 82) +
      cheeks(79) +
      '<path d="m59 80 5 8 5-8-5-3Z" fill="#e7af68"/><path d="m45 103 4 4 4-4m11 0 4 4 4-4m-17 12 4 4 4-4" fill="none" stroke="#f7e4c7"/><path d="M26 87q-10 19 4 27m72-27q10 19-4 27" fill="#9d7264"/>',
  },
  {
    id: 'axolotl',
    title: 'Axolotl avatar',
    background: '#eee0f5',
    art:
      body('#f0bacd', '#ffe4e7') +
      '<path d="m24 54-13-14m12 28H5m19 12L11 94m93-40 13-14m-12 28h18m-19 12 13 14" fill="none" stroke="#d98eaf" stroke-width="7"/><rect x="23" y="36" width="82" height="68" rx="31" fill="#f4c8d9"/>' +
      eyes(66, 45, 83) +
      cheeks(82) +
      smile(83) +
      '<ellipse cx="42" cy="116" rx="9" ry="6" fill="#f4c8d9"/><ellipse cx="86" cy="116" rx="9" ry="6" fill="#f4c8d9"/>',
  },
];

const directory = new URL('../public/avatars/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const portrait of portraits) {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><title>' +
    portrait.title +
    '</title><defs><clipPath id="crop"><circle cx="64" cy="64" r="64"/></clipPath></defs><g clip-path="url(#crop)"><circle cx="64" cy="64" r="64" fill="' +
    portrait.background +
    '"/><g stroke="' +
    ink +
    '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
    portrait.art +
    '</g></g></svg>\n';
  await writeFile(new URL(portrait.id + '.svg', directory), svg);
}
console.log('Wrote ' + portraits.length + ' original animal avatars.');
