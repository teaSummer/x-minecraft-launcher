<template>
  <div
    class="template-content w-full"
    style="overflow: auto; padding: 24px 24px 16px"
  >
    <v-skeleton-loader
      v-if="loading"
      type="list-item-avatar-two-line, list-item-avatar-two-line, list-item-avatar-two-line, list-item-avatar-two-line, list-item-avatar-two-line, list-item-avatar-two-line"
    />
    <v-list
      v-else
      class="min-h-[50vh] bg-transparent p-0"
      two-line
    >
      <v-list-item class="mb-2">
        <div class="flex w-full gap-3">
          <v-select
            v-model="selectedVersionFilterOption"
            class="max-w-40"
            hide-details
            label="Minecraft"
            :items="versionFilterOptions"
            clearable
          />
          <v-spacer />
          <v-text-field
            ref="searchTextRef"
            v-model="filterText"
            hide-details
            filled
            append-icon="filter_list"
            :label="t('filter')"
          />
        </div>
      </v-list-item>
      <v-divider />
      <v-list-item
        v-for="p in items"
        :key="p.filePath"
        ripple
        @click="onSelect(p)"
      >
        <v-list-item-avatar>
          <v-img
            :src="p.instance.icon ? p.instance.icon : ''"
          />
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>{{ p.name }}</v-list-item-title>
          <v-list-item-subtitle class="flex gap-1">
            <v-chip
              v-if="p.instance.runtime.minecraft"
              outlined
              small
              label
            >
              <v-avatar left>
                <img
                  :src="'http://launcher/icons/minecraft'"
                  alt="minecraft"
                >
              </v-avatar>
              {{ p.instance.runtime.minecraft }}
            </v-chip>
            <v-chip
              v-if="p.instance.runtime.forge"
              outlined
              small
              label
            >
              <v-avatar left>
                <img
                  :src="'http://launcher/icons/forge'"
                  alt="forge"
                >
              </v-avatar>
              {{ p.instance.runtime.forge }}
            </v-chip>
            <v-chip
              v-if="p.instance.runtime.fabricLoader"
              outlined
              small
              label
            >
              <v-avatar left>
                <img
                  :src="'http://launcher/icons/fabric'"
                  alt="fabric"
                >
              </v-avatar>
              {{ p.instance.runtime.fabricLoader }}
            </v-chip>
          </v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
          <v-list-item-action-text>{{ p.description }}</v-list-item-action-text>
        </v-list-item-action>
        <v-list-item-action>
          <v-checkbox
            :value="selectedTemplate === p"
            readonly
          />
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </div>
</template>

<script lang=ts setup>
import { useFeedTheBeastVersionsCache } from '@/composables/ftb'
import { kInstanceCreation } from '@/composables/instanceCreation'
import { kJavaContext } from '@/composables/java'
import { kModpacks } from '@/composables/modpack'
import { kPeerState } from '@/composables/peers'
import { injection } from '@/util/inject'
import { Ref } from 'vue'
import { Template, useInstanceTemplates } from '../composables/instanceTemplates'

const emit = defineEmits(['select'])

// Templates
const { all } = injection(kJavaContext)
const { resources } = injection(kModpacks)
const { connections } = injection(kPeerState)
const { cache: cachedList } = useFeedTheBeastVersionsCache()
const { templates } = useInstanceTemplates(all, resources, connections, cachedList)
const selectedTemplatePath = inject('template', ref(''))
const selectedTemplate = computed(() => templates.value.find(f => f.filePath === selectedTemplatePath.value))
function onSelect(template: Template) {
  if (selectedTemplate.value === template) {
    emit('select')
    return
  }
  selectedTemplatePath.value = template.filePath
}
const { data: creationData, files, loading, error } = injection(kInstanceCreation)
watch(selectedTemplate, async (t) => {
  if (!t) return
  const instData = t.instance
  creationData.name = instData.name
  creationData.runtime = { ...instData.runtime }
  creationData.java = instData.java ?? ''
  creationData.showLog = instData.showLog ?? false
  creationData.hideLauncher = instData.hideLauncher ?? true
  creationData.vmOptions = [...instData.vmOptions ?? []]
  creationData.mcOptions = [...instData.mcOptions ?? []]
  creationData.maxMemory = instData.maxMemory ?? 0
  creationData.minMemory = instData.minMemory ?? 0
  creationData.author = instData.author ?? ''
  creationData.description = instData.description ?? ''
  creationData.url = instData.url ?? ''
  creationData.icon = instData.icon ?? ''
  creationData.modpackVersion = instData.modpackVersion || ''
  creationData.server = instData.server ? { ...instData.server } : null
  creationData.upstream = instData.upstream

  files.value = t.files
  try {
    loading.value = true
    files.value = await t.loadFiles()
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }

  emit('select')
}, { immediate: true })

const filterText = ref('')
const versionFilterOptions = computed(() => templates.value.map(v => v.instance.runtime.minecraft).filter((v): v is string => !!v))
const selectedVersionFilterOption = ref('')
const searchTextRef: Ref<null | HTMLElement> = ref(null)
const { t } = useI18n()

const items = computed(() => templates.value.filter((template) => {
  if (selectedVersionFilterOption.value) {
    if (template.instance.runtime.minecraft !== selectedVersionFilterOption.value) return false
  }
  const searching = (filterText.value ?? '').toLowerCase()
  if (searching.length === 0) {
    return true
  }
  if (template.name.toLowerCase().indexOf(searching) !== -1) {
    return true
  }
  if (template.instance.runtime.minecraft.toLowerCase().indexOf(searching) !== -1) {
    return true
  }
  if (template.instance.runtime.forge?.toLowerCase().indexOf(searching) !== -1) {
    return true
  }
  if (template.instance.runtime.fabricLoader?.toLowerCase().indexOf(searching) !== -1) {
    return true
  }
  return false
}).sort((a, b) => a.name.localeCompare(b.name)))

onUnmounted(() => {
  filterText.value = ''
})

 // notify({
      //   title: t('importModpack.success', { modpack: template?.name }),
      //   level: 'success',
      //   full: true,
      //   more() {
      //     router.push('/')
      //   },
      // })
      // notify({
      //   title: t('importModpack.failed', { modpack: template?.name }),
      //   level: 'error',
      //   full: true,
      //   more() {
      //     showTaskDialog()
      //   },
      // })
</script>

<style>
.java-select .v-select__selection {
  white-space: nowrap;
  overflow-x: hidden;
  overflow-y: hidden;

  max-width: 240px;
}
.v-stepper__step span {
  margin-right: 12px !important;
}
.v-stepper__step div {
  display: flex !important;
}

.template-content
  .theme--.v-text-field
  > .v-input__control
  > .v-input__slot:before {
  border: none;
}
</style>