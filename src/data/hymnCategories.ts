import { HymnCategory } from '../types';

export interface HymnCategoryInfo {
  id: string;
  nameSi: string;
  nameEn: string;
  liturgicalPart: HymnCategory;
  numberRange: string;
}

export const HYMN_CATEGORIES: HymnCategoryInfo[] = [
  {
    id: 'entrance',
    nameSi: 'ඇතුල්වීමේ ගීතිකා',
    nameEn: 'Entrance Hymns',
    liturgicalPart: 'Entrance',
    numberRange: '1 - 36, 501 - 513',
  },
  {
    id: 'psalms',
    nameSi: 'තෙහිලි ගී සහ දේව වචනය',
    nameEn: 'Psalms & Word of God',
    liturgicalPart: 'Responsorial Psalm',
    numberRange: '37 - 102, 514 - 519',
  },
  {
    id: 'offertory',
    nameSi: 'පුදසුන සූදානම් කරන ගී',
    nameEn: 'Offertory Hymns',
    liturgicalPart: 'Offertory',
    numberRange: '103 - 159, 520 - 534',
  },
  {
    id: 'communion',
    nameSi: 'දිව්‍ය භෝජන ගීතිකා',
    nameEn: 'Communion Hymns',
    liturgicalPart: 'Communion',
    numberRange: '160 - 251, 538',
  },
  {
    id: 'recessional',
    nameSi: 'සමුගැනීමේ ගීතිකා',
    nameEn: 'Recessional / Final',
    liturgicalPart: 'Recessional',
    numberRange: '252 - 273',
  },
  {
    id: 'mass-parts',
    nameSi: 'ගායනා පූජා සඳහා ගී',
    nameEn: 'Mass Ordinary (Kyrie / Gloria / Sanctus)',
    liturgicalPart: 'Kyrie',
    numberRange: '274 - 318, 602 - 613',
  },
  {
    id: 'jesus',
    nameSi: 'ජේසු තුමන්ට ගීතිකා',
    nameEn: 'Hymns to Jesus',
    liturgicalPart: 'Post-Communion',
    numberRange: '319 - 347, 614 - 662',
  },
  {
    id: 'eucharistic',
    nameSi: 'සත්ප්‍රසාදීය හා ආශිර්වාද',
    nameEn: 'Eucharistic & Benediction',
    liturgicalPart: 'Benediction',
    numberRange: '348 - 359, 535 - 539',
  },
  {
    id: 'easter-lent',
    nameSi: 'පාස්කු හා චතාරික ගීතිකා',
    nameEn: 'Lent & Easter',
    liturgicalPart: 'Recessional',
    numberRange: '360 - 375, 685 - 699',
  },
  {
    id: 'marian',
    nameSi: 'දේව මෑණියන්ට ගීතිකා',
    nameEn: 'Marian Hymns',
    liturgicalPart: 'Recessional',
    numberRange: '376 - 421, 700 - 715',
  },
  {
    id: 'holy-spirit',
    nameSi: 'ශුද්ධාත්ම ගීතිකා',
    nameEn: 'Holy Spirit Hymns',
    liturgicalPart: 'Entrance',
    numberRange: '422 - 427, 721 - 728',
  },
  {
    id: 'christmas',
    nameSi: 'නත්තල් හා ආගමන ගීතිකා',
    nameEn: 'Christmas & Advent',
    liturgicalPart: 'Recessional',
    numberRange: '428 - 449, 663 - 684',
  },
  {
    id: 'saints',
    nameSi: 'සාන්තුවරයන් සඳහා ගීතිකා',
    nameEn: 'Saints Hymns',
    liturgicalPart: 'Recessional',
    numberRange: '450 - 460, 729 - 737',
  },
  {
    id: 'wedding',
    nameSi: 'විවාහ මංගල ගීතිකා',
    nameEn: 'Wedding Hymns',
    liturgicalPart: 'Entrance',
    numberRange: '716 - 720',
  },
  {
    id: 'vocation',
    nameSi: 'දේව කැඳවීම පිළිබඳ ගීතිකා',
    nameEn: 'Vocation & Priesthood',
    liturgicalPart: 'Offertory',
    numberRange: '738 - 744',
  },
  {
    id: 'trinity-worship',
    nameSi: 'ත්‍රිත්වයට හා නමස්කාර ගී',
    nameEn: 'Holy Trinity & Worship',
    liturgicalPart: 'Benediction',
    numberRange: '745 - 750',
  },
  {
    id: 'general',
    nameSi: 'විවිධ හා දේශානුරාගී ගී',
    nameEn: 'General & National Hymns',
    liturgicalPart: 'Recessional',
    numberRange: '461 - 500, 540 - 601, 751 - 755',
  },
];
