/*	
	Those scripts are aimed solely for the Cypher Systems on FoundryVTT made by Mrkwnzl and will
	probably (totally in fact) not work with any other systems.
	
	Those add-ons could be totally added directly inside the Cypher System at a later date
	All of them are well-commented/documented and normally kept as understandable as possible for 
	anyone to pick them and modify/patch them as they wish.
	I have no business in keeping anything obfuscated and blind. My main thoughts are that everyone
	has to start somewhere and understanding other code is one way to do so. With this, I aim to
	keep those different scripts as light as possible.
	
	Moreover, all of my scripts are totally free to use, modify, etc. as they are under the BSD-3-Clause
	license. I just ask for you to try to keep the same scope as me and if possible, a little credit is 
	always appreciated ;)
	Also, feel free to make a pull request! I will be more than happy to see what are your QOL too!
	
	However, everyone has his/her/its/their own way to code and mine is mine, so if you were not able
	to understand something, please feel free to ask me on Discord.
	
	This is my structure:
	- 'Globales' are var used everywhere in this js and do not need to be re-made each time
	- 'Classes' are either specific or custom classes used for scripts
	- 'Handlers' are scripts that handle (or hook) specific events
	- 'Functions' are functions either called by handlers or anywhere else, they hold most of my scripts
	- 'Utilities' are scripts to do small calculation across other functions
	
	Cheers,
	Nice to see you (NiceTSY)
*/

'use strict';
import { UTILITIES } from './utilities.js';

/*------------------------------------------------------------------------------------------------
------------------------------------------ Global(es) -------------------------------------------
------------------------------------------------------------------------------------------------*/
const quantifier = '@';

const typeSentenceCheck = [
	`${quantifier}descriptor`,
	`${quantifier}focus`,
	`${quantifier}type`,
	`${quantifier}additional`,
	`${quantifier}additionalsentence`
];

const typeStatCheck = [
	`${quantifier}might`,
	`${quantifier}speed`,
	`${quantifier}intellect`,
	`${quantifier}additional`,
	`${quantifier}additionalpool`,
	`${quantifier}effort`
];

const typeItemsCheck = [
	`${quantifier}item`,
	`${quantifier}skill`,
	`${quantifier}ability`,
	`${quantifier}cypher`,
	`${quantifier}artifact`,
	`${quantifier}oddity`,
	`${quantifier}weapon`,
	`${quantifier}armor`,
	`${quantifier}equipment`,
	`${quantifier}material`
];

let skillLevels = [
	'Specialized',
	'Trained',
	'Practiced',
	'Inability'
];

/*------------------------------------------------------------------------------------------------
------------------------------------------- Class(es) --------------------------------------------
------------------------------------------------------------------------------------------------*/
/**
 * @description Class for the creation sentence
 * @class creationSentence
 */
class creationSentence {
	constructor(descriptor = '', focus = '', type = '', additionalSentence = '') {
		this.descriptor = descriptor;
		this.focus = focus;
		this.type = type;
		this.additionalSentence = additionalSentence;
	};
};

/**
 * @description Class for the statistics creation
 * @class creationStat
 */
class creationStat {
	constructor(value = 10, edge = 0, poolModificator = 0, edgeModificator = 0) {
		this.value = (Number.isInteger(value)) ? value : 10;
		this.edge = (Number.isInteger(edge)) ? edge : 0;
		this.poolModificator = poolModificator;
		this.edgeModificator = edgeModificator;
	};
};

/**
 * @description Class holding the stats
 * @class creationStats
 */
class creationStats {
	constructor(might = new creationStat(), speed = new creationStat(), intellect = new creationStat(), additional = new creationStat()) {
		this.might = might;
		this.speed = speed;
		this.intellect = intellect;
		this.additional = additional;
	};
};

/**
 * @description Class holding information about skills
 * @class creationSkill
 */
class creationSkill {
	constructor(id = '', name = '', level = 2, skill = {}) {
		this.id = id;
		this.name = name;
		this.level = level;
		this.skill = skill;
	};
};

/**
 * @description Class holding information about abilities
 * @class creationAbility
 */
class creationAbility {
	constructor(id = '', name = '', tier = 0, ability = {}) {
		this.id = id;
		this.name = name;
		this.tier = tier;
		this.ability = ability;
	};
};

/**
 * @description Class holding information about items
 * @class creationItem
 */
class creationItem {
	constructor(id = '', name = '', quantity = 1, item = {}) {
		this.id = id;
		this.name = name;
		this.quantity = quantity;
		this.item = item;
	};
};

/**
 * @description Class to hold the data needed for the creation of the character
 * @class creationData
 */
class creationData {
	constructor() {
		this.sentence = new creationSentence();

		this.tier = 1;
		this.effort = 0;
		this.effortModificator = 0;

		this.stats = new creationStats();

		this.skills = [];
		this.abilities = [];
		this.items = [];
	};

	/**
	 * @description Change the specified type of the sentence
	 * @param { String } type
	 * @param { String } sentence
	 * @return {*} 
	 * @memberof creationData
	 */
	changeSentence(type, sentence) {
		if (!type in this.sentence) return;
		this.sentence[type] = sentence;
	};

	/**
	 * @description Set the tier of the creation data
	 * @param { Number } tier
	 * @return {*} 
	 * @memberof creationData
	 */
	setTier(tier) {
		if (!Number.isInteger(tier)) return;
		this.tier = tier;
	};

	/**
	 * @description Change a stat value
	 * @param { String } stat
	 * @param { Number / creationStat } value
	 * @return {*} 
	 * @memberof creationData
	 */
	changeStat(stat, value) {
		if (stat === 'effort') {
			if (!Number.isInteger(value)) return;
			this.effort = value;
		} else {
			value = Object.assign(new creationStat(), value);
			if (!stat in this.stats) return;
			this.stats[stat] = value;
		};
	};

	/**
	 * @description Add a modificator (either for pool or edge) to a stat
	 * @param { String } stat
	 * @param { String } type - pool or edge
	 * @param { String } modificator
	 * @return {*} 
	 * @memberof creationData
	 */
	addStatModificator(stat, type, modificator) {
		if (stat === 'effort') {
			const current = this.effortModificator,
				mathExpression = current + modificator;

			this.effortModificator = mathExpression;
		} else if (!stat in this.stats) return;

		if (type === 'pool') {
			const current = this.stats[stat].poolModificator,
				mathExpression = current + modificator;

			this.stats[stat].poolModificator = mathExpression;
		} else if (type === 'edge') {
			const current = this.stats[stat].edgeModificator,
				mathExpression = current + modificator;

			this.stats[stat].edgeModificator = mathExpression;
		};
	};

	/**
	 * @description Check if a skill exists and return it
	 * @param { String } idOrName
	 * @return { Boolean / creationSkill } 
	 * @memberof creationData
	 */
	skillExists(idOrName) {
		for (const skill of this.skills)
			if (skill) if (skill.id == idOrName || skill.name === idOrName) return skill;

		return false;
	};

	/**
	 * @description Set the level (inability, practiced, trained, specialized) of a skill
	 * @param { String } idOrName
	 * @param { Number } level
	 * @return {*} 
	 * @memberof creationData
	 */
	setSkillLevel(idOrName, level) {
		if (!Number.isInteger(level)) return;
		for (const skill of this.skills) {
			if (!skill) continue;
			if (skill.id == idOrName || skill.name === idOrName) {
				level = parseInt(level);

				skill.skill.data.skillLevel = skillLevels[level];
				skill.skill.data.rollButton.skill = skillLevels[level];
				skill.level = level;
			};
		};
	};

	/**
	 * @description Get the level of a skill
	 * @param { String } idOrName
	 * @return { Boolean / Number } 
	 * @memberof creationData
	 */
	getSkillLevel(idOrName) {
		for (const skill of this.skills)
			if (skill) if (skill.id == idOrName || skill.name === idOrName) return skill.level;

		return false;
	};

	/**
	 * @description Check if an ability exists and return it
	 * @param { String } idOrName
	 * @return { Boolean / creationAbility } 
	 * @memberof creationData
	 */
	abilityExists(idOrName) {
		for (const ability of this.abilities)
			if (ability) if (ability.id == idOrName || ability.name === idOrName) return ability;

		return false;
	};

	/**
	 * @description Set the tier of an ability 
	 * @param { String } idOrName
	 * @param { Number } tier
	 * @return {*} 
	 * @memberof creationData
	 */
	setAbilityTier(idOrName, tier) {
		if (!Number.isInteger(tier)) return;
		if (parseInt(tier) > 6) return;
		for (const ability of this.abilities) {
			if (!ability) continue;
			if (ability.id == idOrName || ability.name === idOrName) {
				ability.tier = parseInt(tier);
			};
		};
	};

	/**
	 * @description Get the tier of an ability 
	 * @param { String } idOrName
	 * @return { Boolean / Number } 
	 * @memberof creationData
	 */
	getAbilityTier(idOrName) {
		for (const ability of this.abilities)
			if (ability) if (ability.id == idOrName || ability.name === idOrName) return ability.tier;

		return false;
	};

	/**
	 * @description Check if an item exists and return it
	 * @param { String } idOrName
	 * @return { Boolean / creationItem } 
	 * @memberof creationData
	 */
	itemExists(idOrName) {
		for (const item of this.items)
			if (item) if (item.id == idOrName || item.name === idOrName) return item;

		return false;
	};

	/**
	 * @description Set the quantity of an item 
	 * @param { String } idOrName
	 * @param { Number } quantity
	 * @return {*} 
	 * @memberof creationData
	 */
	setItemQuantity(idOrName, quantity) {
		if (!Number.isInteger(quantity)) return;
		for (const item of this.items) {
			if (!item) continue;
			if (item.id == idOrName || item.name === idOrName) {
				quantity = parseInt(quantity);

				if ('quantity' in item.item.data) item.item.data.quantity = quantity;
				item.quantity = quantity;
			};
		};
	};

	/**
	 * @description Get the quantity of an item 
	 * @param { String } idOrName
	 * @return { Boolean / Number } 
	 * @memberof creationData
	 */
	getItemQuantity(idOrName) {
		for (const item of this.items)
			if (item) if (item.id == idOrName || item.name === idOrName) return item.quantity;

		return false;
	};
}

/*------------------------------------------------------------------------------------------------
------------------------------------------ Function(s) -------------------------------------------
------------------------------------------------------------------------------------------------*/
/**
 * @description Check if the journal is one used for the creation tool
 * @export
 * @param { Object } actor
 * @param { Object } html
 * @param { Object } journal
 * @return {*} 
 */
export async function checkJournalType(actor, html, journal) {
	pushLocalisationSkillLevel();

	const buttons = Array.from($('.linkedButton')).map(b => b.id);
	let journals = game.journal.filter(j => buttons.includes(j.id));
	journal = await game.journal.get(journal.id);

	const journalContent = returnArrayOfHtmlContent(journal.data.content);
	let journalType = journalContent[0].replace(/ .*/, '').toLowerCase();
	if (!isGoodJournalType(journalType)) return;

	for (const j of journals) {
		const jContent = returnArrayOfHtmlContent(j.data.content),
			jType = jContent[0].replace(/ .*/, '').toLowerCase();

		if (jType === journalType) {
			journalType = UTILITIES.sanitizeString(journalType);
			ui.notifications.warn(game.i18n.format('NICECYPHER.CreationAlreadySentence', { type: `${journalType} (${j.name})` }));
			return;
		};
	};

	journals.push(journal);
	getContent(journals, actor);
};

/**
 * @description Check if the actor possess any linked data (aka journal) for its sentences
 * @export
 * @param { Object } html
 * @param { Object } actor
 */
export async function checkIfLinkedData(html, actor) {
	pushLocalisationSkillLevel();

	const nameCheck = [
		actor.data.data.basic.descriptor,
		actor.data.data.basic.focus,
		actor.data.data.basic.type,
		actor.data.data.basic.additionalSentence
	];

	for (const name of nameCheck) {
		if (!name || name === '') continue;

		const id = getJournalIdInName(name),
			journal = await game.journal.get(id);

		if (journal) {
			const content = returnArrayOfHtmlContent(journal.data.content);
			updateActorSheet(html, content[0].replace(/ .*/, '').toLowerCase(), journal);
		};
	};
};

/**
 * @description Update the character sheet to show the linked buttons.
 * @param { Object } html
 * @param { String } toUpdate
 * @param { Object } data
 */
function updateActorSheet(html, toUpdate, data) {
	toUpdate = (toUpdate === `${quantifier}additional` || toUpdate === `${quantifier}additionalsentence`)
		? 'additionalSentence'
		: UTILITIES.sanitizeString(toUpdate);

	const newNode = (`
		<button id="${data.id}" name="data.basic.${toUpdate}" 
		title="${game.i18n.format('NICECYPHER.CreationButtonHint', {type: UTILITIES.capitalizeFirstLetter(toUpdate)})}" class="linkedButton">
			<i class="fas fa-book-open"></i> ${data.name}
		</button>
	`),
		oldNode = $(`input[name="data.basic.${toUpdate}"`);

	oldNode.replaceWith(newNode);
	$(`#${data.id}`).click(e => {
		if (!e.altKey) game.journal.get(e.target.id).sheet.render(true)
		else {
			const actorId = e.target.offsetParent.id,
				actor = game.actors.get(actorId.substring(6)),
				buttons = Array.from($('.linkedButton')).map(b => b.id);
			let journals = game.journal.filter(j => buttons.includes(j.id));

			journals.push(game.journal.get(e.target.id));
			getContent(journals, actor, true);
		};
	});
};

/**
 * @description Check if it is really a journal for the creation tool, return the type of the journal if so.
 * @param { String } type
 * @return { Boolean / String } 
 */
function isGoodJournalType(type) {
	if (!UTILITIES.doesArrayContains(type, typeSentenceCheck)) return false;
	return type;
}

/**
 * @description Read through all journals passed, and put everything under the creationActor before passing to the next function.
 * @param { Array<Object> } journals
 * @param { Object } 		actor
 * @param { Boolean } [remove=false]
 */
async function getContent(journals, actor, remove = false) {
	let creationActor = new creationData(),
		allSkills = [],
		allAbilities = [],
		allItems = [],
		currentJournal = 0;
	const removeJournal = (remove) ? journals.length - 1 : -1;

	for (const journal of journals) {
		const del = (removeJournal == currentJournal) ? true : false,
			lines = returnArrayOfHtmlContent(journal.data.content),
			checkFirstLine = isGoodJournalType(lines[0].toLowerCase());

		if (!checkFirstLine) continue;
		const s = (checkFirstLine === `${quantifier}additional` || checkFirstLine === `${quantifier}additionalsentence`)
			? 'additionalSentence'
			: UTILITIES.sanitizeString(checkFirstLine);

		creationActor.changeSentence(s, (!del) ? `${journal.name} {${journal.id}}` : '');

		for (const line of lines) {
			const l = line;

			if (l === checkFirstLine) continue;
			if (!l.startsWith(quantifier)) continue;

			let occurrences = [];
			for (var i = l.length; i--;) if (l[i] == quantifier) occurrences.push(i);

			const type = getObject(occurrences.pop(), l).toLowerCase(),
				object = (occurrences.length > 0) ? getObject(occurrences.pop(), l) : false,
				other = (occurrences.length > 0) ? occurrences.pop() : false;

			// Stats
			if (UTILITIES.doesArrayContains(type, typeStatCheck)) {
				const stat = type.substring(1),
					value = l.match(/\d+/g),
					operation = l.match(/[+\-](\.\d+|\d+(\.\d+)?)/g);

				if (stat === 'effort' && !operation) creationActor.changeStat(stat, (!del) ? parseInt(value[0]) : 0);
				else if (operation) {
					let op = operation[0];

					if (stat === 'effort') {
						if (del) op = (op.includes('+')) ? op.replace('+', '-') : op.replace('-', '+');
						creationActor.addStatModificator(stat, 'effort', op)
					} else {
						if (del) op = (op.includes('+')) ? op.replace('+', '-') : op.replace('-', '+');
						creationActor.addStatModificator(stat, 'pool', op);

						op = operation[1];
						if (!op) continue
						if (del) op = (op.includes('+')) ? op.replace('+', '-') : op.replace('-', '+');
						creationActor.addStatModificator(stat, 'edge', op);
					};
				} else if (Number.isInteger(parseInt(value[0]))) {
					const s = (stat === 'additionalpool') ? 'additional' : stat,
						statValue = (!del)
							? new creationStat(parseInt(value[0]), parseInt(value[1]), creationActor.stats[s].poolModificator, creationActor.stats[s].edgeModificator)
							: new creationStat(10, 0, creationActor.stats[s].poolModificator, creationActor.stats[s].edgeModificator);

					creationActor.changeStat(s, statValue);
				};
			}
			// Abilities / Skills / Equipments
			else if (UTILITIES.doesArrayContains(type, typeItemsCheck)) {
				const id = object.match(/\[(.*?)\]/)[1],
					compendium = id.split('.');

				let item;
				if (compendium.length > 1) {
					const pack = game.packs.find(p => p.metadata.name === compendium[1]),
						index = pack.index.get(compendium[2]),
						i = await pack.getDocument(index._id);
					item = await game.items.fromCompendium(i);

				} else item = await game.items.get(id).data;

				const duplicatedItem = duplicate(item),
					optionType = (other) ? getObject(other, l).toLowerCase() : false,
					option = (other) ? l.substring(other + getObject(other, l).length + 1).replace(/ .*/, '') : false;

				// Check equipment
				if ('quantity' in duplicatedItem.data) {
					const quantity = (optionType === `${quantifier}quantity` && option) ? parseInt(option) : 1;

					let existingItem = creationActor.itemExists(duplicatedItem.name);
					if (existingItem) {
						const newQuantity = (!del)
							? parseInt(existingItem.quantity) + parseInt(quantity)
							: parseInt(existingItem.quantity) - parseInt(quantity);

						creationActor.setItemQuantity(existingItem.id, newQuantity);
					} else {
						const newItem = new creationItem(duplicatedItem._id, duplicatedItem.name, quantity, duplicatedItem)
						creationActor.items.push(newItem);
						creationActor.setItemQuantity(duplicatedItem._id, quantity);
					};
				}
				// Check skills
				else if (duplicatedItem.type === 'skill') {
					const o = (optionType === `${quantifier}level` && option) ? UTILITIES.capitalizeFirstLetter(option.toLowerCase()) : skillLevels[2];
					let skillLevel = 2;

					if (UTILITIES.doesArrayContains(o, skillLevels)) {
						skillLevel = skillLevels.indexOf(o) > 3
							? skillLevels.indexOf(o) - 4
							: skillLevels.indexOf(o);
					};

					let existingSkill = creationActor.skillExists(duplicatedItem.name);

					if (existingSkill) {
						if (!del) {
							const oldLevel = creationActor.getSkillLevel(existingSkill.id),
								newLevel = Math.floor((parseInt(oldLevel) + parseInt(skillLevel)) / 2);

							creationActor.setSkillLevel(existingSkill.id, newLevel);
							allSkills.push({ id: allSkills.length, journal: journal.name, skill: duplicatedItem.name, level: skillLevel });
						} else {
							const oldJournalSkill = allSkills.filter(s => s.skill === duplicatedItem.name);

							if (oldJournalSkill.length > 1) {
								let newLevel = 0;
								for (const s of oldJournalSkill) if (s.journal != journal.name) newLevel += s.level;

								newLevel = Math.floor(newLevel / (oldJournalSkill.length - 1));
								creationActor.setSkillLevel(existingSkill.id, newLevel);
							} else delete creationActor.skills[oldJournalSkill[0].id];
						}
					} else if (!del) {
						const newSkill = new creationSkill(duplicatedItem._id, duplicatedItem.name, skillLevel, duplicatedItem);

						creationActor.skills.push(newSkill);
						creationActor.setSkillLevel(duplicatedItem._id, skillLevel);
						allSkills.push({ id: allSkills.length, journal: journal.name, skill: duplicatedItem.name, level: skillLevel });
					};
				}
				// Check abilities
				else if (duplicatedItem.type === 'ability') {
					const tierLevel = parseInt((optionType === `${quantifier}tier` && option) ? option : 0),
						actorTier = actor.data.data.basic.tier;

					let existingAbility = creationActor.abilityExists(duplicatedItem.name);
					if (!existingAbility && tierLevel <= actorTier && !del) {
						const newAbility = new creationAbility(duplicatedItem._id, duplicatedItem.name, tierLevel, duplicatedItem);

						creationActor.abilities.push(newAbility);
						allAbilities.push({ id: allAbilities.length, journal: journal.name, ability: duplicatedItem.name, tier: tierLevel });
					} else if (tierLevel <= actorTier && del) {
						const oldJournalAbility = allAbilities.filter(s => s.ability === duplicatedItem.name);
						if (oldJournalAbility.length == 1) delete creationActor.abilities[oldJournalAbility[0].id];
					};
				}
				// Other
				else {
					let existingItem = creationActor.itemExists(duplicatedItem.name);

					if (del) {
						const oldJournalItem = allItems.filter(i => i.item === duplicatedItem.name);

						if (oldJournalItem.length >= 1) {
							const oldItem = creationActor.items.find(i => i.name === duplicatedItem.name)
							delete creationActor.items[creationActor.items.indexOf(oldItem)];
							creationActor.items = creationActor.items.filter(i => i);
						};

					} else {
						allItems.push({ id: allItems.length, journal: journal.name, item: duplicatedItem.name })

						// Only artifacts cannot exist two times
						if (existingItem && duplicatedItem.type === 'artifact') continue;

						const newItem = new creationItem(duplicatedItem._id, duplicatedItem.name, 1, duplicatedItem);
						creationActor.items.push(newItem);
					};
				};
			};
		};

		currentJournal++;

		// TODO: delete this line
		console.log(creationActor);
	};

	updateActorData(actor, creationActor)
};

/**
 * @description Update the actor data according to the current data sent. It will wip clean the character sheet before doing so.
 * @param { Object } actor
 * @param { creationData } data
 */
async function updateActorData(actor, data) {
	let itemsToCreate = [],
		itemsToDelete = [];

	// Effort
	const checkEffortModificator = eval(data.effortModificator);
	if (checkEffortModificator > 0) {
		const newEffortValue = eval(`${data.effort}+${checkEffortModificator}`);
		data.changeStat('effort', newEffortValue);
	};

	let updatedData = { [`data.basic.effort`]: data.effort };
	await actor.update(updatedData);

	// Sentence
	for (const s in data.sentence) {
		updatedData = { [`data.basic.${s}`]: data.sentence[s] };
		await actor.update(updatedData);
	};

	// Stats
	for (const s in data.stats) {
		const checkPoolModificator = eval(data.stats[s].poolModificator),
			checkEdgeModificator = eval(data.stats[s].edgeModificator);

		if (checkPoolModificator > 0 || checkEdgeModificator > 0) {
			const newPoolValue = eval(`${data.stats[s].value}+${checkPoolModificator}`),
				newEdgeValue = eval(`${data.stats[s].edge}+${checkEdgeModificator}`),
				statValue = new creationStat(parseInt(newPoolValue), parseInt(newEdgeValue));

			data.changeStat(s, statValue);
		};

		updatedData = [
			{ [`data.pools.${s}.value`]: data.stats[s].value },
			{ [`data.pools.${s}.max`]: data.stats[s].value },
			{ [`data.pools.${s}Edge`]: data.stats[s].edge }
		];

		for (const d of updatedData) await actor.update(d)
	};

	// Skills
	const existingSkills = actor.items.filter(i => i.data.type === 'skill');
	for (const s of existingSkills) itemsToDelete.push(s.id);
	for (const s of data.skills) if (s) itemsToCreate.push(s.skill);

	// Abilities
	const existingAbilities = actor.items.filter(i => i.data.type === 'ability');
	for (const a of existingAbilities) itemsToDelete.push(a.id);
	for (const a of data.abilities) if (a) itemsToCreate.push(a.ability);

	// Other
	const existingItems = actor.items.filter(i => (i.data.type !== 'skill' && i.data.type !== 'ability'));
	for (const a of existingItems) itemsToDelete.push(a.id);
	for (const i of data.items) if (i) if (i.item.type !== 'skill' && i.item.type !== 'ability' && i.quantity > 0) itemsToCreate.push(i.item);

	// TODO: delete this line
	console.log(itemsToDelete)
	// TODO: delete this line
	console.log(itemsToCreate)

	if (itemsToDelete.length > 0) await actor.deleteEmbeddedDocuments('Item', itemsToDelete);
	if (itemsToCreate.length > 0) await actor.createEmbeddedDocuments('Item', itemsToCreate);
};

/**
 * @description Push the localisation string of the skill level to the check
 * @return {*} 
 */
function pushLocalisationSkillLevel() {
	if (UTILITIES.doesArrayContains(game.i18n.localize('CYPHERSYSTEM.Specialized'), skillLevels)) return;

	skillLevels.push(game.i18n.localize('CYPHERSYSTEM.Specialized'));
	skillLevels.push(game.i18n.localize('CYPHERSYSTEM.Trained'));
	skillLevels.push(game.i18n.localize('CYPHERSYSTEM.Practiced'));
	skillLevels.push(game.i18n.localize('CYPHERSYSTEM.Inability'));
};

/**
 * @description Return the content of an HTML in an array
 * @param { String } str
 * @return { Array<String> } 
 */
function returnArrayOfHtmlContent(str) {
	return UTILITIES.removeTags(str).split('\n').filter(n => n);
};

/**
 * @description Return an object for the tag
 * @param { Number } start
 * @param { String } str
 * @return { String } 
 */
function getObject(start, str) {
	return str.substring(start).replace(/ .*/, '');
};

/**
 * @description Return the journal ID from its saved name
 * @param { String } str
 * @return { String } 
 */
function getJournalIdInName(str) {
	return str.substring(
		str.indexOf("{") + 1,
		str.lastIndexOf("}")
	);
};