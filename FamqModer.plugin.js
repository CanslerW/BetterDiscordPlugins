/**
 * @name FamqPoster
 * @version 0.0.2
 * @description Залупа для модера
 * @license MIT
 * @author canslerw
 * @authorId 336032579142549504
 * @website https://github.com/CanslerW/BetterDiscord_plugins/tree/main
 * @source https://raw.githubusercontent.com/CanslerW/BetterDiscord_plugins/refs/heads/main/FamqModer.plugin.js
 * @updateUrl https://raw.githubusercontent.com/CRAWNiiK/CommandCenter/refs/heads/main/CommandCenter.plugin.js
 */

'use strict';

const SETTINGS_KEY = 'settings';
const DEFAULT_SETTINGS = {};

class Utils {
    static isObject(object) {
        return typeof object === 'object' && !!object && !Array.isArray(object);
    }
}

class BaseService {
    constructor(plugin) {
        this.plugin = plugin;
        this.bdApi = this.plugin.bdApi;
        this.logger = this.bdApi.Logger;
    }
}

class SettingsService extends BaseService {
    settings = DEFAULT_SETTINGS;

    start() {
        const savedSettings = this.bdApi.Data.load(SETTINGS_KEY);
        this.settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings);

        return Promise.resolve();
    }

    stop() {
        // Do nothing
    }
}

class ModulesService extends BaseService {
    start() {
        this.dispatcher = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byKeys('dispatch', 'subscribe'));

        this.commandsModule = BdApi.Webpack.getModule((exports) => {
            if (!Utils.isObject(exports)) return false;
            if (exports.Z !== undefined) return false;

            return Object.entries(exports).some(([key, value]) => {
                if (!(typeof value === 'function')) return false;
                const valueString = value.toString();

                const match = valueString.includes('BUILT_IN_INTEGRATION') && valueString.includes('BUILT_IN_TEXT');
                if (match) this.commandsModuleKey = key;

                return match;
            });
        });

        this.messageModule = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byKeys('sendMessage'));
        this.channelModule = BdApi.Webpack.getStore('SelectedChannelStore');

        if (!this.commandsModule || !this.messageModule || !this.channelModule) {
            this.logger.error('One or more modules not found!');
            return Promise.reject();
        }

        return Promise.resolve();
    }

    stop() {
        // Do nothing
    }
}

class PatchesService extends BaseService {
    capt_def;
    capt_win;
    bank_crime;
    postavka;
    start(modulesService) {
        this.capt_win = {
            id: 'Capt_win',
            untranslatedName: 'капт_выиграли',
            displayName: 'капт_выиграли',
            type: 1, // CHAT
            inputType: 0, // BUILT_IN
            applicationId: '-1', // BUILT_IN
            untranslatedDescription: 'капт_выиграли',
            displayDescription: 'выиграла квадрат',
            options: [
                {
                    name: 'fam1',
                    displayName: 'Выиграла',
                    description: 'Укажи фаму которая выиграла',
                    displayDescription: 'Укажи фаму которая выиграла',
                    required: true,
                    type: 3, // STRING
                },
                {
                    name: 'zone',
                    displayName: 'Квадрат',
                    description: 'Укажи квадрат который выиграла',
                    displayDescription: 'Укажи фаму которая выиграла ',
                    required: true,
                    type: 3, // STRING
                },
                {
                    name: 'fam2',
                    displayName: 'Проиграла',
                    description: 'Укажи фаму которая проиграла',
                    displayDescription: 'Укажи фаму которая проиграла',
                    required: true,
                    type: 3, // STRING
                },
            ],
            execute: async (event) => {
                try {
                    const { sendMessage } = BdApi.findModuleByProps('sendMessage');
                    const channelId = event.channelId || modulesService.channelModule.getCurrentlySelectedChannelId();
                    const fam1 = event[0]?.value ?? '';
                    const fam2 = event[2]?.value ?? '';
                    const zone = event[1]?.value ?? '';
                    

                    if (!fam1) {
                        this.logger.error('fam1 is missing');
                        return;
                    }
                    if (!fam2) {
                        this.logger.error('fam2 is missing');
                        return;
                    }
                    if (!zone) {
                        this.logger.error('zone is missing');
                        return;
                    }

                    sendMessage(channelId, { content: `_<:20d771138449479eb29cecc8d114d997:1132269508837507133> **${fam1}** выиграла квадрат **${zone}** у **${fam2}**_` });

                } catch (error) {
                    this.logger.error('Error executing capt command:', error);
                }
            }
        };
        this.capt_def = {
            id: 'Capt_def',
            untranslatedName: "капт_защитили",
            displayName: 'капт_защитили',
            type: 1, // CHAT
            inputType: 0, // BUILT_IN
            applicationId: '-1', // BUILT_IN
            untranslatedDescription: 'капт_защитили',
            displayDescription: 'защитила квадрат',
            options: [
                {
                    name: 'fam1',
                    displayName: 'Защитник',
                    description: 'Укажи фаму которая защитила квадрат',
                    displayDescription: 'Укажи фаму которая защитила квадрат',
                    required: true,
                    type: 3, // STRING
                },
                {
                    name: 'zone',
                    displayName: 'квадрат',
                    description: 'Укажи квадрат',
                    displayDescription: 'Укажи квадрат',
                    required: true,
                    type: 3, // STRING
                },
                {
                    name: 'fam2',
                    displayName: 'Нападающий',
                    description: 'Укажи фаму которая напала',
                    displayDescription: 'Укажи фаму которая напала',
                    required: true,
                    type: 3, // STRING
                },
            ],
            execute: async (event) => {
                try {
                    const { sendMessage } = BdApi.findModuleByProps('sendMessage');
                    const channelId = event.channelId || modulesService.channelModule.getCurrentlySelectedChannelId();
                    const fam1 = event[0]?.value ?? '';
                    const fam2 = event[2]?.value ?? '';
                    const zone = event[1]?.value ?? '';
                    

                    if (!fam1) {
                        this.logger.error('fam1 is missing');
                        return;
                    }
                    if (!fam2) {
                        this.logger.error('fam2 is missing');
                        return;
                    }
                    if (!zone) {
                        this.logger.error('zone is missing');
                        return;
                    }

                    sendMessage(channelId, { content: `_<:11b7b73fc4004fcfa3b49806916cce41:1132269516135604264> **${fam1}** защитила квадрат **${zone}** от **${fam2}**_` });

                } catch (error) {
                    this.logger.error('Error executing capt command:', error);
                }
            }
        };
        this.bank_crime = {
            id: 'bank_crime',
            untranslatedName: "банк_ограбили",
            displayName: 'банк_ограбили',
            type: 1, // CHAT
            inputType: 0, // BUILT_IN
            applicationId: '-1', // BUILT_IN
            untranslatedDescription: 'Успешно ограбили банк',
            displayDescription: 'Успешно ограбили банк',
            options: [
                {
                    name: 'fam1',
                    displayName: 'нападающий',
                    description: 'Укажите фому которая ограбила банк',
                    displayDescription: 'Укажите фому которая ограбила банк',
                    required: true,
                    type: 3, // STRING
                },
                {
                    name: 'number',
                    displayName: 'номер',
                    description: 'Укажите номер банка который ограбили',
                    displayDescription: 'Укажите номер банка который ограбили',
                    required: true,
                    type: 3, // STRING
                },
            ],
            execute: async (event) => {
                try {
                    const { sendMessage } = BdApi.findModuleByProps('sendMessage');
                    const channelId = event.channelId || modulesService.channelModule.getCurrentlySelectedChannelId();
                    const fam1 = event[0]?.value ?? '';
                    const number = event[1]?.value ?? '';

                    if (!fam1) {
                        this.logger.error('fam1 is missing');
                        return;
                    }

                    sendMessage(channelId, { content: `<:mac3:1057686428978524190> _${fam1} успешно ограбила **БАНК #${number}** _` });

                } catch (error) {
                    this.logger.error('Error executing capt command:', error);
                }
            }
        }
        this.bank_gov = {

        }
        this.postavka = {
            id: 'postavka',
            untranslatedName: "поставка",
            displayName: 'поставка',
            type: 1, // CHAT
            inputType: 0, // BUILT_IN
            applicationId: '-1', // BUILT_IN
            untranslatedDescription: 'Перекрыта поставка',
            displayDescription: 'Перекрыта поставка',
            options: [
                {
                    name: 'fam1',
                    displayName: 'нападающий',
                    description: 'Укажите фому которая перекрыла поставку',
                    displayDescription: 'Укажите фому которая перекрыла поставку',
                    required: true,
                    type: 3, // STRING
                },
                {
                    name: 'gos',
                    displayName: 'гос. структура',
                    description: 'Укажите чью поставку перекрыли',
                    displayDescription: 'Укажите чью поставку перекрыли',
                    required: true,
                    type: 3, // STRING
                },
                {
                    name: 'items',
                    displayName: 'предметы',
                    description: 'Укажите какие что было на поставке',
                    displayDescription: 'Укажите какие что было на поставке',
                    required: true,
                    type: 3, // STRING
                },
                {
                    name: 'ozer',
                    displayName: 'кого_убили',
                    description: 'Укажите какие фракции были убиты',
                    displayDescription: 'Укажите какие фракции были убиты',
                    required: false,
                    type: 3, // STRING
                },
                {
                    name: 's_kem',
                    displayName: 'С_кем_напали',
                    description: 'Укажите фракцию с кем напала основая фракция',
                    displayDescription: 'Укажите фракцию с кем напала основая фракция',
                    required: false,
                    type: 3, // STRING
                },
            ],
            execute: async (event) => {
                try {
                    const { sendMessage } = BdApi.findModuleByProps('sendMessage');
                    const channelId = event.channelId || modulesService.channelModule.getCurrentlySelectedChannelId();
                    const fam1 = event[0]?.value ?? '';
                    const gos = event[1]?.value ?? '';
                    const items = event[2]?.value ?? '';
                    const ozer = event[3]?.value;
                    const s_kem = event[4]?.value;

                    let message = s_kem && s_kem.trim().length > 0 
                    ? `_:f53acfca9925447dbdf8b02c7b31c88f: **${fam1}** совместно с **${s_kem}** перекрыла крафт **${gos}** на **${items}**`
                    : `_:f53acfca9925447dbdf8b02c7b31c88f: **${fam1}** перекрыла крафт **${gos}** на **${items}**`;
                
                if (ozer && ozer.trim().length > 0) {
                    message += `\n\n_в процессе нападения **${fam1}** также убила **${ozer}**_`;
                }
                    
                    sendMessage(channelId, { content: message });

                } catch (error) {
                    this.logger.error('Error executing capt command:', error);
                }
            }
        }
        if (modulesService.commandsModuleKey) {
            this.bdApi.Patcher.after(modulesService.commandsModule, modulesService.commandsModuleKey, (_, __, result) => {
                result.push(this.capt_win, this.capt_def, this.bank_crime, this.postavka);
            });
        } else {
            this.logger.error('commandsModuleKey не найдено!');
        }

        return Promise.resolve();
    }

    stop() {
        this.profilePicCommand = undefined;
        this.famqmod = undefined;
        this.bdApi.Patcher.unpatchAll();
    }
}

class FamqPoster {
    settingsService;
    modulesService;
    patchesService;

    meta;
    bdApi;
    logger;

    constructor(meta) {
        this.meta = meta;
        this.bdApi = new BdApi(this.meta.name);
        this.logger = this.bdApi.Logger;
    }

    start() {
        this.doStart().catch((error) => {
            this.logger.error(error);
        });
    }

    async doStart() {
        await this.startServicesAndPatches();
    }

    async startServicesAndPatches() {
        this.settingsService = new SettingsService(this);
        await this.settingsService.start();

        this.modulesService = new ModulesService(this);
        await this.modulesService.start();

        this.patchesService = new PatchesService(this);
        await this.patchesService.start(this.modulesService);
    }

    stop() {
        this.patchesService?.stop();
        this.patchesService = undefined;

        this.modulesService?.stop();
        this.modulesService = undefined;

        this.settingsService?.stop();
        this.settingsService = undefined;
    }

    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.style.padding = "15px";
        panel.style.backgroundColor = "#202225";
        panel.style.color = "#fff";
        panel.style.borderRadius = "10px";
        panel.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)";
        panel.style.display = "flex";
        panel.style.flexDirection = "column";
        panel.style.gap = "15px";
    
        const title = document.createElement("h3");
        title.innerText = "Настройки команд";
        title.style.textAlign = "center";
        title.style.marginBottom = "10px";
        title.style.color = "#7289DA";
        panel.appendChild(title);
    
        const commands = {
            capt_win: "Капт (выиграли)",
            capt_def: "Капт (защитили)",
            bank_crime: "Ограбление банка",
            postavka: "Перекрытие поставки"
        };
    
        Object.keys(commands).forEach((commandKey) => {
            const container = document.createElement("div");
            container.style.display = "flex";
            container.style.justifyContent = "space-between";
            container.style.alignItems = "center";
            container.style.padding = "12px";
            container.style.border = "1px solid #7289DA";
            container.style.borderRadius = "8px";
            container.style.backgroundColor = "#2f3136";
            container.style.transition = "background 0.3s";
    
            const label = document.createElement("span");
            label.innerText = commands[commandKey];
            label.style.fontSize = "14px";
    
            const switchContainer = document.createElement("label");
            switchContainer.style.position = "relative";
            switchContainer.style.display = "inline-block";
            switchContainer.style.width = "40px";
            switchContainer.style.height = "20px";
    
            const input = document.createElement("input");
            input.type = "checkbox";
            input.style.opacity = "0";
            input.style.width = "0";
            input.style.height = "0";
            input.checked = this.settingsService.settings[commandKey];
    
            const slider = document.createElement("span");
            slider.style.position = "absolute";
            slider.style.cursor = "pointer";
            slider.style.top = "0";
            slider.style.left = "0";
            slider.style.right = "0";
            slider.style.bottom = "0";
            slider.style.backgroundColor = input.checked ? "#43B581" : "#72767d";
            slider.style.transition = "0.4s";
            slider.style.borderRadius = "34px";
    
            const circle = document.createElement("span");
            circle.style.position = "absolute";
            circle.style.height = "14px";
            circle.style.width = "14px";
            circle.style.left = "3px";
            circle.style.bottom = "3px";
            circle.style.backgroundColor = "white";
            circle.style.transition = "0.4s";
            circle.style.borderRadius = "50%";
            circle.style.transform = input.checked ? "translateX(20px)" : "translateX(0px)";
    
            slider.appendChild(circle);
            switchContainer.appendChild(input);
            switchContainer.appendChild(slider);
    
            input.addEventListener("change", () => {
                this.settingsService.settings[commandKey] = input.checked;
                this.bdApi.Data.save(SETTINGS_KEY, this.settingsService.settings);
                slider.style.backgroundColor = input.checked ? "#43B581" : "#72767d";
                circle.style.transform = input.checked ? "translateX(20px)" : "translateX(0px)";
            });
    
            container.appendChild(label);
            container.appendChild(switchContainer);
            panel.appendChild(container);
        });
    
        return panel;
    }
    

}

module.exports = FamqPoster;
