/**
 * @name FamqPoster
 * @version 1.1.0
 * @description Плагин который упростит жизнь модераторам
 * @author canslerw
 * @authorId 336032579142549504
 * @website https://canslerw.github.io/BetterDiscord/index.html
 * @source https://github.com/CanslerW/BetterDiscord_plugins/blob/main/FamqModer.plugin.js
 * @updateUrl https://raw.githubusercontent.com/CanslerW/BetterDiscord_plugins/main/FamqModer.plugin.js
 */

'use strict';

const SETTINGS_KEY = 'settings';
const DEFAULT_SETTINGS = {
    capt_win: true,
    capt_def: true,
    bank_crime: true,
    postavka: true,
    craft: true,
    bank_gos: true,
};

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
    capt_win;
    capt_def;
    bank_crime;
    postavka;
    craft;
    bank_gos;

    start(modulesService, settingsService) {
        const commands = [];
        if (settingsService.settings.postavka) {
            this.postavka = {
                id: 'postavka',
                untranslatedName: 'поставка',
                displayName: 'поставка',
                type: 1, // CHAT
                inputType: 0, // BUILТ_IN
                applicationId: '-1', // BUILТ_IN
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
                        description: 'Укажите чью поставку поставку',
                        displayDescription: 'Укажите чью поставку поставку',
                        required: true,
                        type: 3, // STRING
                    },
                    {
                        name: 'items',
                        displayName: 'предметы',
                        description: 'Укажите какие предметы были на поставке',
                        displayDescription: 'Укажите какие предметы были на поставке',
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
                        description: 'Укажите фракцию с кем напала основная фракция',
                        displayDescription: 'Укажите фракцию с кем напала основная фракция',
                        required: false,
                        type: 3, // STRING
                    },
                ],
                execute: async (event) => {
                    try {
                        const { sendMessage } = BdApi.findModuleByProps('sendMessage');
                        const channelId = event.channelId || modulesService.channelModule.getCurrentlySelectedChannelId();
                        const getValueById = (id) => {
                            const option = this.postavka.options.find(option => option.name === id);
                            if (option) {
                                return event.find(e => e.name === id)?.value ?? '';
                            }
                            return '';
                        };
            
                        const fam1 = getValueById('fam1');
                        const gos = getValueById('gos');
                        const items = getValueById('items');
                        const ozer = getValueById('ozer');
                        const s_kem = getValueById('s_kem');

                        const verbCover = (s_kem && s_kem.trim().length > 0) ? "перекрыли" : "перекрыла";
                        const verbKill = (s_kem && s_kem.trim().length > 0) ? "убили" : "убила";
                    
                        let message = `_<:f53acfca9925447dbdf8b02c7b31c88f:1057690801720803440> **${fam1}**`;
                    
                        if (s_kem && s_kem.trim().length > 0) {
                            message += ` совместно с **${s_kem}** ${verbCover} поставку **${gos}** на **${items}**_`;
                        } else {
                            message += ` ${verbCover} поставку **${gos}** на **${items}**_`;
                        }
                    
                        if (ozer && ozer.trim().length > 0) {
                            if (s_kem && s_kem.trim().length > 0) {
                                message += `\n\n_*в процессе нападения **${fam1}** совместно с **${s_kem}** также ${verbKill} **${ozer}**_`;
                            } else {
                                message += `\n\n_*в процессе нападения **${fam1}** также ${verbKill} **${ozer}**_`;
                            }
                        }
                        
                        sendMessage(channelId, { content: message }).then(() => {
                            BdApi.UI.showNotice("Сообщение успешно отправлено!", {
                                type: "success",
                                timeout: 3000,
                                buttons: [
                                    {
                                        label: "OK",
                                        onClick: (close) => close()
                                    }
                                ]
                            });
                        });

                    } catch (error) {
                        this.logger.error('Error executing postavka command:', error);
                    }
                }
            };
            commands.push(this.postavka);
        }

        if (settingsService.settings.capt_win) {
            this.capt_win = {
                id: 'Capt_win',
                untranslatedName: 'капт_выиграли',
                displayName: 'капт_выиграли',
                type: 1, // CHAT
                inputType: 0, // BUILT_IN
                applicationId: '-1', // BUILТ_IN
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
                        displayDescription: 'Укажи фаму которая выиграла',
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
                        const getValueById = (id) => {
                            const option = this.capt_win.options.find(option => option.name === id);
                            if (option) {
                                return event.find(e => e.name === id)?.value ?? '';
                            }
                            return '';
                        };
                        const fam1 = getValueById('fam1');
                        const fam2 = getValueById('fam2');
                        const zone = getValueById('zone');

                        sendMessage(channelId, { content: `_<<:20d771138449479eb29cecc8d114d997:1132269508837507133> **${fam1}** выиграла квадрат **${zone}** у **${fam2}**_` }).then(() => {
                            BdApi.UI.showNotice("Сообщение успешно отправлено!", {
                                type: "success",
                                timeout: 3000,
                                buttons: [
                                    {
                                        label: "OK",
                                        onClick: (close) => close()
                                    }
                                ]
                            });
                        })    

                    } catch (error) {
                        this.logger.error('Error executing capt_win command:', error);
                    }
                }
            };
            commands.push(this.capt_win);
        }

        if (settingsService.settings.capt_def) {
            this.capt_def = {
                id: 'Capt_def',
                untranslatedName: 'капт_защитили',
                displayName: 'капт_защитили',
                type: 1, // CHAT
                inputType: 0, // BUILT_IN
                applicationId: '-1', // BUILТ_IN
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
                        displayName: 'Квадрат',
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
                        const getValueById = (id) => {
                            const option = this.capt_def.options.find(option => option.name === id);
                            if (option) {
                                return event.find(e => e.name === id)?.value ?? '';
                            }
                            return '';
                        };
            
                        const fam1 = getValueById('fam1');
                        const fam2 = getValueById('fam2');
                        const zone = getValueById('zone');

                        sendMessage(channelId, { content: `_<:11b7b73fc4004fcfa3b49806916cce41:1132269516135604264> **${fam1}** защитила квадрат **${zone}** от **${fam2}**_` })    .then(() => {
                            BdApi.UI.showNotice("Сообщение успешно отправлено!", {
                                type: "success",
                                timeout: 3000,
                                buttons: [
                                    {
                                        label: "OK",
                                        onClick: (close) => close()
                                    }
                                ]
                            });
                        })

                    } catch (error) {
                        this.logger.error('Error executing capt_def command:', error);
                    }
                }
            };
            commands.push(this.capt_def);
        }

        if (settingsService.settings.bank_crime) {
            this.bank_crime = {
                id: 'bank_crime',
                untranslatedName: 'банк_ограбили',
                displayName: 'банк_ограбили',
                type: 1, // CHAT
                inputType: 0, // BUILТ_IN
                applicationId: '-1', // BUILТ_IN
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
                    {
                        name: 'fam2',
                        displayName: 'доп_фама',
                        description: 'Укажите фому которая ограбила банк',
                        displayDescription: 'Укажите фому которая ограбила банк',
                        required: false,
                        type: 3, // STRING
                    },
                ],
                execute: async (event) => {
                    try {
                        const { sendMessage } = BdApi.findModuleByProps('sendMessage');
                        const channelId = event.channelId || modulesService.channelModule.getCurrentlySelectedChannelId();
                        const getValueById = (id) => {
                            const option = this.bank_crime.options.find(option => option.name === id);
                            if (option) {
                                return event.find(e => e.name === id)?.value ?? '';
                            }
                            return '';
                        };
            
                        const fam1 = getValueById('fam1');
                        const number = getValueById('number');
                        const fam2 = getValueById('fam2');
                        let message = `<:mac3:1057686428978524190> _`;
                        if(fam2) {
                            message += `${fam1} совместно с **${fam2}** успешно ограбили **БАНК #${number}** _`;
                        } else {
                            message += `${fam1} успешно ограбила **БАНК #${number}** _`;
                        }
                        sendMessage(channelId, { content: message })    .then(() => {
                            BdApi.UI.showNotice("Сообщение успешно отправлено!", {
                                type: "success",
                                timeout: 3000,
                                buttons: [
                                    {
                                        label: "OK",
                                        onClick: (close) => close()
                                    }
                                ]
                            });
                        })
                    } catch (error) {
                        this.logger.error('Error executing bank_crime command:', error);
                    }
                }
            };
            commands.push(this.bank_crime);
        }
        if (settingsService.settings.bank_gos) {
            this.bank_gos = {
                id: 'bank_gos',
                untranslatedName: 'банк_отбили',
                displayName: 'банк_отбили',
                type: 1, // CHAT
                inputType: 0, // BUILТ_IN
                applicationId: '-1', // BUILТ_IN
                untranslatedDescription: 'Успешно отбили ограбление банка',
                displayDescription: 'Успешно отбили ограбление банка',
                options: [
                    {
                        name: 'gos',
                        displayName: 'Кто_отбил',
                        description: 'Укажите гос. структуру которая отбила банк',
                        displayDescription: 'Укажите гос. структуру которая отбила банк',
                        required: true,
                        type: 3, // STRING
                    },
                    {
                        name: 'crime',
                        displayName: 'кто_напал',
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
                    {
                        name: 'dop_gos',
                        displayName: 'кто_еще_был_гос',
                        description: 'Укажите какие еще гос. структуры были.',
                        displayDescription: 'Укажите какие еще гос. структуры были.',
                        required: false,
                        type: 3, // STRING
                    },
                    {
                        name: 'dop_crime',
                        displayName: 'кто_еще_был_крайм',
                        description: 'Укажите какие еще из крайма был.',
                        displayDescription: 'Укажите какие еще из крайма был.',
                        required: false,
                        type: 3, // STRING
                    },
                ],
                execute: async (event) => {
                    try {
                        const { sendMessage } = BdApi.findModuleByProps('sendMessage');
                        const channelId = event.channelId || modulesService.channelModule.getCurrentlySelectedChannelId();
                        const getValueById = (id) => {
                            const option = this.bank_gos.options.find(option => option.name === id);
                            if (option) {
                                return event.find(e => e.name === id)?.value ?? '';
                            }
                            return '';
                        };
            
                        const gos = getValueById('gos');
                        const crime = getValueById('crime');
                        const number = getValueById('number');
                        const dop_gos = getValueById('dop_gos');
                        const dopcrime = getValueById('dop_crime');

            let message = `<:mac3:1057686428978524190> _**${gos}**`;
            if (!dop_gos && !dopcrime) {
                message += ` успешно отбили ограбление **БАНКА #${number}** от **${crime}**_`;
            }
            else if (dop_gos && !dopcrime) {
                message += ` 2совместно с **${dop_gos}** успешно отбили ограбление **БАНКА #${number}** от **${crime}**_`;
            }
            else if (!dop_gos && dopcrime) {
                message += ` успешно отбили ограбление **БАНКА #${number}** от **${crime}** совместно с **${dopcrime}**_`;
            }
            else if (dop_gos && dopcrime) {
                message += ` совместно с **${dop_gos}** успешно отбили ограбление **БАНКА #${number}** от **${crime}** совместно с **${dopcrime}**_`;
            }
            
            sendMessage(channelId, { content: message }).then(() => {
                BdApi.UI.showNotice("Сообщение успешно отправлено!", {
                    type: "success",
                    timeout: 3000,
                    buttons: [
                        {
                            label: "OK",
                            onClick: (close) => close()
                        }
                    ]
                });
            })
                    } catch (error) {
                        this.logger.error('Error executing bank_gos command:', error);
                    }
                }
            };
            commands.push(this.bank_gos);
        }
        if (settingsService.settings.craft) {
            this.craft = {
                id: 'craft',
                untranslatedName: 'крафт',
                displayName: 'крафт',
                type: 1, // CHAT
                inputType: 0, // BUILТ_IN
                applicationId: '-1', // BUILТ_IN
                untranslatedDescription: 'Перекрыт крафт',
                displayDescription: 'Перекрыт крафт',
                options: [
                    {
                        name: 'fam1',
                        displayName: 'нападающий',
                        description: 'Укажите фому которая перекрыла крафт',
                        displayDescription: 'Укажите фому которая перекрыла крафт',
                        required: true,
                        type: 3, // STRING
                        
                    },
                    {
                        name: 'gos',
                        displayName: 'гос. структура',
                        description: 'Укажите чью поставку крафт',
                        displayDescription: 'Укажите чью поставку крафт',
                        required: true,
                        type: 3, // STRING
                    },
                    {
                        name: 'items',
                        displayName: 'предметы',
                        description: 'Укажите какие предметы были на крафте',
                        displayDescription: 'Укажите какие предметы были на крафте',
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
                        description: 'Укажите фракцию с кем напала основная фракция',
                        displayDescription: 'Укажите фракцию с кем напала основная фракция',
                        required: false,
                        type: 3, // STRING
                    },
                ],
                execute: async (event) => {
                    try {
                        const { sendMessage } = BdApi.findModuleByProps('sendMessage');
                        const channelId = event.channelId || modulesService.channelModule.getCurrentlySelectedChannelId();
                        const getValueById = (id) => {
                            const option = this.craft.options.find(option => option.name === id);
                            if (option) {
                                return event.find(e => e.name === id)?.value ?? '';
                            }
                            return '';
                        };
            
                        const fam1 = getValueById('fam1');
                        const gos = getValueById('gos');
                        const items = getValueById('items');
                        const ozer = getValueById('ozer');
                        const s_kem = getValueById('s_kem');

                        const verbCover = (s_kem && s_kem.trim().length > 0) ? "перекрыли" : "перекрыла";
                        const verbKill = (s_kem && s_kem.trim().length > 0) ? "убили" : "убила";
                    
                        let message = `_<:f53acfca9925447dbdf8b02c7b31c88f:1057690801720803440> **${fam1}**`;
                    
                        if (s_kem && s_kem.trim().length > 0) {
                            message += ` совместно с **${s_kem}** ${verbCover} крафт **${gos}** на **${items}**_`;
                        } else {
                            message += ` ${verbCover} крафт **${gos}** на **${items}**_`;
                        }
                    
                        if (ozer && ozer.trim().length > 0) {
                            if (s_kem && s_kem.trim().length > 0) {
                                message += `\n\n_*в процессе нападения **${fam1}** совместно с **${s_kem}** также ${verbKill} **${ozer}**_`;
                            } else {
                                message += `\n\n_*в процессе нападения **${fam1}** также ${verbKill} **${ozer}**_`;
                            }
                        }
                        
                        sendMessage(channelId, { content: message }).then(() => {
                            BdApi.UI.showNotice("Сообщение успешно отправлено!", {
                                type: "success",
                                timeout: 3000,
                                buttons: [
                                    {
                                        label: "OK",
                                        onClick: (close) => close()
                                    }
                                ]
                            });
                        })

                    } catch (error) {
                        this.logger.error('Error executing postavka command:', error);
                    }
                }
            };
            commands.push(this.craft);
        }

        if (modulesService.commandsModuleKey) {
            this.bdApi.Patcher.after(modulesService.commandsModule, modulesService.commandsModuleKey, (_, __, result) => {
                result.push(...commands);
            });
        } else {
            this.logger.error('commandsModuleKey не найдено!');
        }
        
        return Promise.resolve();
    }

    stop() {
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
        await this.patchesService.start(this.modulesService, this.settingsService);
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
            capt_win: "/капт_выиграли",
            capt_def: "/капт_защитили",
            bank_crime: "/банк_ограбили",
            bank_gos: "/банк_отбили",
            postavka: "/поставка",
            craft: "/крафт"
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
                this.updateCommands();
            });
    
            container.appendChild(label);
            container.appendChild(switchContainer);
            panel.appendChild(container);
        });
    
        // КНОПКА "ПОКАЗАТЬ ИЗМЕНЕНИЯ"
        const changelogButton = document.createElement("button");
        changelogButton.innerText = "Показать изменения";
        changelogButton.style.padding = "10px";
        changelogButton.style.backgroundColor = "#7289DA";
        changelogButton.style.color = "#fff";
        changelogButton.style.border = "none";
        changelogButton.style.borderRadius = "5px";
        changelogButton.style.cursor = "pointer";
        changelogButton.style.textAlign = "center";
        changelogButton.style.marginTop = "10px";
        changelogButton.style.fontSize = "14px";
        changelogButton.style.transition = "background 0.3s";
        
        changelogButton.addEventListener("mouseover", () => {
            changelogButton.style.backgroundColor = "#5b6eae";
        });
    
        changelogButton.addEventListener("mouseout", () => {
            changelogButton.style.backgroundColor = "#7289DA";
        });
    
        changelogButton.addEventListener("click", () => {
            BdApi.UI.showChangelogModal({
                title: "FamqPoster",
                subtitle: `version ${this.meta.version}`,
                blurb: "Обновление плагина для модераторов!",
                changes: [
                    {
                        title: "Новые возможности",
                        type: "added",
                        blurb: "Что нового в этом обновлении?",
                        items: [
                            "Добавлена возможность смотреть изменения в файле!",
                            "Исправлена логика команд.",
                            "Добавлено уведомление после отправки команды."
                        ]
                    },
                    {
                        title: "Исправления",
                        type: "fixed",
                        items: [
                            "Исправлена ошибка сохранения настроек.",
                            "Исправлены ошибка когда не отображались эмодзи.",
                            "Исправлены текста..",
                            "Улучшена стабильность работы."
                        ]
                    }
                ]
            });
        });
    
        panel.appendChild(changelogButton);
    
        return panel;
    }
    

    updateCommands() {
        if (this.patchesService) {
            this.patchesService.stop();
            this.patchesService.start(this.modulesService, this.settingsService);
        }
    }
}

module.exports = FamqPoster;