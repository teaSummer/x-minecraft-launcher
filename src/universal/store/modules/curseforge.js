import Vue from 'vue';
/**
 * @type {import('./curseforge').CurseForgeModule}
 */
const mod = {
    state: {
        downloading: {},
    },
    getters: {
        isFileInstalled: (state, _, rt, rg) => (file) => {
            /**
             * @param {{ source: any; }} m
             */
            const find = (m) => {
                const source = m.source;
                if ('curseforge' in source && typeof source.curseforge === 'object') {
                    const s = source.curseforge;
                    if (s.href === file.href || s.fileId === file.id) return true;
                }
                return false;
            };
            if (rg.mods.find(find)) return true;
            if (rg.resourcepacks.find(find)) return true;
            if (rg.modpacks.find(find)) return true;
            if (rg.saves.find(find)) return true;

            return false;
        },
        findFileInstalled: (state, _, rt, rg) => (file) => {
            /**
             * @param {{ source: any; }} m
             */
            const find = (m) => {
                const source = m.source;
                if ('curseforge' in source && typeof source.curseforge === 'object') {
                    const s = source.curseforge;
                    if (s.href === file.href || s.fileId === file.id) return true;
                }
                return false;
            };
            let result;
            /* eslint-disable no-cond-assign */
            if (result = rg.mods.find(find)) return result;
            if (result = rg.resourcepacks.find(find)) return result;
            if (result = rg.modpacks.find(find)) return result;
            if (result = rg.saves.find(find)) return result;
            /* eslint-enable no-cond-assign */

            return undefined;
        },
    },
    mutations: {
        startDownloadCurseforgeFile(state, p) {
            Vue.set(state.downloading, p.download.href, p);
        },
        endDownloadCurseforgeFile(state, p) {
            Vue.delete(state.downloading, p.href);
        },
    },
};

export default mod;