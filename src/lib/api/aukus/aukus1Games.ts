import type { GamesItem, PreviousGame } from "./types"

const SegallGamesAukus1: PreviousGame[] = [
	{
		title: 'Bomjman',
		rating: '8/10',
		review: 'отличная игра, жаль, что второй части скорее всего не будет',
		status: 'completed',
	},
	{
		title: "Marvel's Guardian Of Galaxy",
		rating: '7.5/10',
		review:
			'выдроченная игра и незаслуженно обосраная, даже как не самый большой фанат (немного хуйтер) комиксов могу сказать, что это топ',
		status: 'completed',
	},
	{
		title: 'SOMA',
		rating: '5/10',
		review: 'геймплей хуйня полная, но концовка топ',
		status: 'completed',
	},
	{
		title: 'Star Wars: Fallen Order',
		rating: '6.5/10',
		review:
			'слишком дохуя пытались засунуть в игру, но в целом нигде до идеала так и не довели',
		status: 'completed',
	},
	{
		title: 'Call Of Duty 2',
		rating: '9/10',
		review: 'ласт глава подзаебала, иначе было бы 10',
		status: 'completed',
	},
	{
		title: 'Барби: Приключения на Ранчо',
		rating: '10 счастливых билетов из 10',
		review: '',
		status: 'completed',
	},
	{
		title: 'Cyberpunk 2077',
		rating: '8.5/10',
		review: 'отличная игра, но концовка (моя) не зашла',
		status: 'completed',
	},
	{
		title: 'NIER: AUTOMATA',
		rating: '4/10',
		review: 'хуйня полная, но жопа ту би это что-то с чем-то',
		status: 'completed',
	},
	{
		title: 'Serious sam 4',
		rating: '0/10',
		review: 'худшая игра в истории',
		status: 'completed',
	},
	{
		title: 'Serious sam: Siberian Mayhem',
		rating: '8/10',
		review: 'НАШИ исправили всю кривоту и уебищность предыдущей части, малаца!',
		status: 'completed',
	},
	{
		title: 'Death Stranding',
		rating: '',
		review: 'гениально, но долго',
		status: 'drop',
	},
	{
		title: 'COD:MW2',
		rating: '9/10',
		review: 'классика',
		status: 'completed',
	},
	{
		title: 'Factorio',
		rating: '',
		review: 'игра кайф полный, но разбираться долго',
		status: 'drop',
	},
	{
		title: 'Ride To Hell: Retribution',
		rating: '1/10',
		review: 'за мемность',
		status: 'completed',
	},
	{
		title: 'U.F.O.S',
		rating: '6/10',
		review: 'не очень напряжный квест',
		status: 'completed',
	},
	{
		title: 'Medal Of Honor: Pacific Assault',
		rating: '-5000000/10',
		review: 'уебищная мокрота дохлой мокрицы',
		status: 'completed',
	},
	{
		title: 'Serious Sam First Encounter HD',
		rating: '7/10',
		review:
			'кайфовый шутан, который лучше проходить за неск дней с кайфом, если разом рашить быстро заебет',
		status: 'completed',
	},
	{
		title: 'Serious Sam 2',
		rating: 'дерьмище каких поискать/10',
		review: '',
		status: 'completed',
	},
	{
		title: 'Fifa 19',
		rating: '7/10',
		review: 'норм фифка',
		status: 'completed',
	},
	{
		title: 'Serious Sam DD XXL',
		rating: '5/10',
		review: 'легкий платформер для ценителей Сэмов',
		status: 'completed',
	},
	{
		title: 'Space Chanel 5 Part 2',
		rating: '4/10',
		review: 'ебанутая ритм игра, к счастью проходима',
		status: 'completed',
	},
	{
		title: 'One Hand Clapping',
		rating: '10/10',
		review:
			'оригинальная игра в которой нужно петь, чтобы продвигаться по сюжету',
		status: 'completed',
	},
	{
		title: 'Worms Armageddon',
		rating: '',
		review: 'pft,fkj xtn',
		status: 'drop',
	},
	{
		title: 'HADES',
		rating: '7/10',
		review:
			'норм игра (но проходить нужно на трезвяк и без тильта, иначе она не пройдется никогда)',
		status: 'completed',
	},
	{
		title: 'Before Your Eyes',
		rating: '6/10',
		review: 'Грустнявое коротенькое кинцо',
		status: 'completed',
	},
	{
		title: 'Warlords BattleCry 3',
		rating: '',
		review: 'стратежка жестковатая, к тому же без руссика',
		status: 'drop',
	},
	{
		title: 'Final Fanstasy 7 remake',
		rating: '4/10',
		review: 'Прикольное кинцо, но настолько отвратный геймплей, что всего лишь',
		status: 'completed',
	},
	{
		title: 'Max payne 3',
		rating: '8.5/10',
		review: 'Классика жанра, один из лучших шутанов от 3-го лица',
		status: 'completed',
	},
	{
		title: 'Serious Sam 3',
		rating: '4/10',
		review: 'Проходится побыстрее 4-й и 2-й части - это большой плюс',
		status: 'completed',
	},
	{
		title: 'Serious Sam Second Encounter',
		rating: '7/10',
		review: 'хорошая часть, топ3 из всех частей',
		status: 'completed',
	},
	{
		title: 'Mafia Definitive Edition',
		rating: '8/10',
		review: 'годный ремейк неповторимой классики',
		status: 'completed',
	},
	{
		title: 'oni!',
		rating: '1/10',
		review:
			'полнейшая хуета: завышенная сложность, кривое управление, уебищная стрельба, однобразный геймплей(постоянно надо активировать ебаные рубильники) НО за боевку + бальчик 1/10',
		status: 'drop',
	},
	{
		title: 'Neon White',
		rating: '7/10',
		review:
			'прикольная игра в стиле сёрф серверов в ксе, с угарным музоном и стилем, под конец душновато, но терпимо',
		status: 'completed',
	},
	{
		title: 'Painkiller: Hell & Damnation',
		rating: '8/10',
		review:
			'Офигенный шутан, который незаслуженно засрали. На голову выше всех сэмов кроме 5-го, в игре есть: обалденная физика, хорошая графика, клевый сеттинг. Что ещё надо???',
		status: 'completed',
	},
	{
		title: 'Mafa 2 (classic)',
		rating: '9.5/10',
		review: 'классика',
		status: 'completed',
	},
	{
		title: 'Как достать соседа',
		rating: '8/10',
		review: 'игра для ума',
		status: 'completed',
	},
	{
		title: 'Как достать соседа 2',
		rating: '8/10',
		review: 'хорошее продолжение 1-й части',
		status: 'completed',
	},
	{
		title: 'neverwiner dlc hz',
		rating: '',
		review: 'сложна и долго',
		status: 'drop',
	},
	{
		title: 'chaser',
		rating: '2/10',
		review:
			'заеба грешная, прикольноe земедло в игре + угарные диалоги - это всё хорошее, что есть в игре, остальное полный кал',
		status: 'completed',
	},
	{
		title: 'Flatout 2',
		rating: '',
		review: 'to be continued...',
		status: 'completed',
	},
]

const LasqaGamesAukus1: PreviousGame[] = [
	{
		title: 'NIOH',
		rating: '',
		review: 'Прикольная тематика, но слишком долгая',
		status: 'drop',
	},
	{
		title: 'Axiom Verge',
		rating: '6.5/10',
		review: 'Метроидвания душненькая, я русский',
		status: 'completed',
	},
	{
		title: 'Hollow Knight',
		rating: '10/10',
		review: 'Просто топ, одна из лучших игр',
		status: 'completed',
	},
	{
		title: 'Postal 2',
		rating: '8/10',
		review: 'Культовая тематика',
		status: 'completed',
	},
	{
		title: 'Star Wars: BattleFront 2 (2005)',
		rating: '8.5/10',
		review: 'Каеф, игра детства',
		status: 'completed',
	},
	{
		title: 'Hitman 1 (2016)',
		rating: '9/10',
		review:
			'Новые хитманы являются потрясающими. Множество способов прохождения, балдёж',
		status: 'completed',
	},
	{
		title: 'Dishonored',
		rating: '8/10',
		review: 'Прикольная игрушечка, желательно проходить по стелсу как нормикс',
		status: 'completed',
	},
	{
		title: 'The Beast Inside',
		rating: '7/10',
		review:
			'Обьективно неплохой хоррор (7/10), но я такое не люблю — всё засрано головоломками и скримерами (2/10)',
		status: 'completed',
	},
	{
		title: 'Superliminal',
		rating: '8.5/10',
		review:
			'Не слишком сложная головоломка, прикольная игруха вообще, разработчики молодцы',
		status: 'completed',
	},
	{
		title: 'DreadOut',
		rating: '3/10',
		review: 'Кривозадый хоррор',
		status: 'completed',
	},
	{
		title: 'Death Stranding',
		rating: '9.5/10',
		review: 'Кайф, понравилось. Каджимбо выморозился по полной программе',
		status: 'completed',
	},
	{
		title: 'Metal Gear Solid V: The Phantom Pain',
		rating: '',
		review:
			'Наверняка великая игра, жаль что не могу себе позволить её сейчас проходить из-за долговизны',
		status: 'drop',
	},
	{
		title: 'World in Conflict: Complete Edition',
		rating: '7.5/10',
		review: 'Клёвая стратежка',
		status: 'completed',
	},
	{
		title: 'F.E.A.R.',
		rating: '8/10',
		review: 'Один из лучших шутеров всех времён',
		status: 'completed',
	},
	{
		title: 'Cry of Fear',
		rating: '8/10 как хоррор, 4/10 моя оценка',
		review:
			'Прикольный фришный хоррор с интересными моментиками и порой душноватый',
		status: 'completed',
	},
	{
		title: "Ninja Gaiden 3: Razor's Edge",
		rating: '7.5/10',
		review:
			'Всем хардкорным любителям Дарк Соулса рекомендуется пройти на харде. Очень сложно и долго было. Если бы я хотел долгой игры, было бы 9.5/10',
		status: 'completed',
	},
	{
		title: 'The Talos Principle',
		rating: '',
		review: 'Долго, сложно, прикольно, дроп',
		status: 'drop',
	},
	{
		title: 'Grand Theft Auto 4',
		rating: '9/10',
		review: 'Годнота, одна из любимых частей',
		status: 'completed',
	},
	{
		title: 'Grand Theft Auto 3',
		rating: '9/10',
		review: 'Классика, играется весело',
		status: 'completed',
	},
	{
		title: 'Call of Duty 2',
		rating: '9/10',
		review: 'Очередная классика на Аукусе',
		status: 'completed',
	},
	{
		title: 'Elasto Mania Remastered',
		rating: '',
		review:
			'Прикольная игруха в стиле Gravity Defied со времён школотрона. Но очень задротская и сложная, так что дроп',
		status: 'drop',
	},
	{
		title: 'My Friend Pedro',
		rating: '7/10',
		review: 'Неплохая недолгая игруха от разрабов Хотлайн Майами',
		status: 'completed',
	},
	{
		title: 'Katana Zero',
		rating: '8/10',
		review: 'Игруха в стиле Хотлайн Майами, получше Педро',
		status: 'completed',
	},
	{
		title: 'Battlefield 3',
		rating: '8.5/10',
		review: 'Неплохая кампаха, взрывы сочные',
		status: 'completed',
	},
	{
		title: 'The Lord of the Rings: The Battle for Middle-Earth II',
		rating: '9/10',
		review: 'Любимая игруха детства, но компания больше нравится в 1-й части',
		status: 'completed',
	},
	{
		title: 'Chrono Trigger',
		rating: '',
		review:
			'Прикольная темка, вроде как культовая ЖРПГ, но на неё у нас сейчас времени нет',
		status: 'drop',
	},
	{
		title: 'Factorio',
		rating: '',
		review: 'Чрезвычайно долгая годнота',
		status: 'drop',
	},
	{
		title: 'NASCAR Racing 2003 Season',
		rating: '',
		review: 'Надо было попасть на лесенку',
		status: 'drop',
	},
	{
		title: 'Sekiro: Shadows Die Twice',
		rating: '',
		review:
			'Очень крутая, но чрезвычайно долгая для меня игра. Как-нить потом пройдем',
		status: 'drop',
	},
	{
		title: 'Minecraft',
		rating: '',
		review: 'Майкрафт хорош',
		status: 'completed',
	},
	{
		title: 'Zanzarah: The Hidden Portal',
		rating: '8/10',
		review: 'Заебатая тема',
		status: 'completed',
	},
	{
		title: 'Touhou 6',
		rating: '',
		review:
			'Задорный скролл-шутер, прошёл бы его часов за 15-20, но сегодня у нас такого времени нет, к сожалению',
		status: 'drop',
	},
	{
		title: 'Max Payne 1',
		rating: '9/10',
		review: 'Культовая тематика',
		status: 'completed',
	},
	{
		title: 'Dead Space 1',
		rating: '',
		review: 'Охуенная игра, дропнули чтобы попыпаться выловить коротуху',
		status: 'drop',
	},
	{
		title: 'The Plan',
		rating: '',
		review: 'Игра про муху на 5 минут',
		status: 'completed',
	},
	{
		title: 'Meteor 60 Seconds!',
		rating: '',
		review: 'Великая игра, тоже на 5 минут',
		status: 'completed',
	},
	{
		title: 'Oni',
		rating: '',
		review:
			'Старый слешер про анимешную тяночку, выглядел годно, но надо было дропать в последний день',
		status: 'drop',
	},
	{
		title: 'Need For Speed: Most Wanted',
		rating: '',
		review: '',
		status: 'drop',
	},
]

export const aukus1Games: { [key: string]: GamesItem } = {
	segall: {
		games: SegallGamesAukus1,
		link: 'https://docs.google.com/spreadsheets/d/1iGjS41dpxbgjtMTGODZ-j3OG9eMDaZh5kBRiWH-FPk0/edit?gid=1969770239#gid=1969770239',
	},
	lasqa: {
		games: LasqaGamesAukus1,
		link: 'https://docs.google.com/spreadsheets/d/1iGjS41dpxbgjtMTGODZ-j3OG9eMDaZh5kBRiWH-FPk0/edit?gid=1235582040#gid=1235582040',
	},
}
