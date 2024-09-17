import { container, DependencyContainer } from "tsyringe"
import modConfig from "../config/config.json"
import construction from "../db/construction.json"
import locales from "../db/locales.json"
import scavCase from "../db/scavcase.json"

import { ILogger } from "@spt/models/spt/utils/ILogger"
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor"
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod"
import { DatabaseServer } from "@spt/servers/DatabaseServer"
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables"
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod"
import { ConfigServer } from "@spt/servers/ConfigServer"
import { ConfigTypes } from "@spt/models/enums/ConfigTypes"
import { IHideoutConfig } from '@spt/models/spt/config/IHideoutConfig'
import { LocaleService } from '@spt/services/LocaleService'

class Mod implements IPostDBLoadMod, IPostSptLoadMod
{
  private modTitle = `Hideout Redux`
  private logger = container.resolve<ILogger>("WinstonLogger")
  private databaseServer = container.resolve<DatabaseServer>("DatabaseServer")
  private configServer = container.resolve<ConfigServer>("ConfigServer")
  private localeService = container.resolve<LocaleService>("LocaleService")
  
  public postDBLoad(container: DependencyContainer): void
  {
    const dbTables: IDatabaseTables = this.databaseServer.getTables()
    const sysLang = this.localeService.getDesiredGameLocale()
    // Apply changes to spt_data/server/hideout/settings
    for (const value in modConfig)
    {
      for (const setting in dbTables.hideout.settings)
      {
        if (setting == value)
        {
          dbTables.hideout.settings[setting] = modConfig[value]
          if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Adjusted DB entry ${setting} to ${dbTables.hideout.settings[setting]}`,LogTextColor.CYAN)}
        }
      }
    }
    // Set new construction requirements
    dbTables.hideout.areas.forEach(area =>
    {
      construction.forEach(entry =>
      {
        if (area._id == entry._id)
        {
          for (const stage in area.stages)
          {
            area.stages[stage] = entry.stages[stage]
            if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Set new ${entry.area} level ${stage} requirements`,LogTextColor.CYAN)}
          }
        }
      })
    })
    // Update scav case payments and rewards
    dbTables.hideout.scavcase = scavCase
      // Update locales to reflect "new" hideout
    for (const locale in locales)
    {
      dbTables.locales.global[sysLang][locale] = locales[locale]
      if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Modified hideout locale: ${locale}`,LogTextColor.CYAN)}
    }
  }
  public postSptLoad(container: DependencyContainer): void
  {
    // Apply changes to spt_data/server/configs/hideout
    const hideoutConfig: IHideoutConfig = this.configServer.getConfig<IHideoutConfig>(ConfigTypes.HIDEOUT)
      for (const value in modConfig)
      {
        for (const config in hideoutConfig)
        {
          if (config == value)
          {
            hideoutConfig[config] = modConfig[value]
            if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Adjusted config entry ${config} to ${hideoutConfig[config]}`,LogTextColor.CYAN)}
          }
        }
      }
      if(!modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Hideout changes applied`,LogTextColor.CYAN)}
  }
}
export const mod = new Mod();