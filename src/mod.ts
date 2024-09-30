import { container, DependencyContainer } from "tsyringe"
import path from "node:path"
import { jsonc } from "jsonc"
import { VFS } from "@spt/utils/VFS"

import construction from "../db/construction.json"
import locales from "../db/locales.json"
import scavCase from "../db/scavcase.json"
import production from "../db/production.json"

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
import { IHideoutProduction } from "@spt/models/eft/hideout/IHideoutProduction"

class Mod implements IPostDBLoadMod, IPostSptLoadMod
{
  private modTitle = `Hideout Redux`
  private logger = container.resolve<ILogger>("WinstonLogger")
  private databaseServer = container.resolve<DatabaseServer>("DatabaseServer")
  private configServer = container.resolve<ConfigServer>("ConfigServer")
  private localeService = container.resolve<LocaleService>("LocaleService")
  private vfs = container.resolve<VFS>("VFS")
  private modConfig = jsonc.parse(this.vfs.readFile(path.resolve(__dirname, "../config/config.jsonc")))
  
  public postDBLoad(container: DependencyContainer): void
  {
    const dbTables: IDatabaseTables = this.databaseServer.getTables()
    const sysLang = this.localeService.getDesiredGameLocale()
    // Apply changes to spt_data/server/hideout/settings
    if (this.modConfig.changeSettingsValues)
    {
      for (const value in this.modConfig.settings)
      {
        for (const setting in dbTables.hideout.settings)
        {
          if (setting == value)
          {
            if(this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Current hideout database value for ${setting} is ${dbTables.hideout.settings[setting]}`,LogTextColor.GRAY)}
            dbTables.hideout.settings[setting] = this.modConfig.settings[value]
            if(this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Adjusted to ${dbTables.hideout.settings[setting]}`,LogTextColor.CYAN)}
          }
        }
      }
    }// End settings changes
    // Set new construction requirements
    if (this.modConfig.requirementChanges)
    {
      construction.forEach(areaMod =>
      {
        dbTables.hideout.areas.forEach(area =>
        {
          if (area._id == areaMod._id)
          {
            for (const stage in area.stages)
            {
              if (stage != "0")
              {
                area.stages[stage].requirements = areaMod.stages[stage].requirements
                if(this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Updated ${areaMod.area} level ${stage} to include ${area.stages[stage].requirements.length} total requirements.`,LogTextColor.CYAN)}
              }
            }
          }
        })
      })
      if(!this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Set new hideout level requirements`,LogTextColor.CYAN)}
    }// End construction requirement changes
    // Set new hideout bonuses
    if (this.modConfig.bonusChanges)
    {
      if (this.modConfig.useDefaultStashSizeBonus)
      {
        construction.forEach(areaMod =>
        {
          dbTables.hideout.areas.forEach(area =>
          {
            if (area.type != 3)
            {
              if (area._id == areaMod._id)
              {
                for (const stage in area.stages)
                {
                  if (stage != "0")
                  {
                    area.stages[stage].bonuses = areaMod.stages[stage].bonuses
                    if(this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Updated ${areaMod.area} level ${stage} to include ${area.stages[stage].bonuses.length} total bonuses.`,LogTextColor.CYAN)}
                  }
                }
              }
            }
          })
        })
      }
      else
      {
        construction.forEach(areaMod =>
        {
          dbTables.hideout.areas.forEach(area =>
          {
            if (area._id == areaMod._id)
            {
              for (const stage in area.stages)
              {
                if (stage != "0")
                {
                  area.stages[stage].bonuses = areaMod.stages[stage].bonuses
                  if(this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Updated ${areaMod.area} level ${stage} to include ${area.stages[stage].bonuses.length} total bonuses.`,LogTextColor.CYAN)}
                }
              }
            }
          })
        })
      }
      if(!this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Set new hideout level bonuses`,LogTextColor.CYAN)}
    }// End hideout bonus changes
    // Set new hideout construction times
    if (this.modConfig.constructionTimeChanges)
    {
      construction.forEach(areaMod =>
      {
        dbTables.hideout.areas.forEach(area =>
        {
          if (area._id == areaMod._id)
          {
            for (const stage in area.stages)
            {
              if (stage != "0")
              {
                area.stages[stage].constructionTime = Math.round(areaMod.stages[stage].constructionTime * this.modConfig.constructionTimeModifier)
                
                if(this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Updated ${areaMod.area} level ${stage} construction time to ${area.stages[stage].constructionTime}.`,LogTextColor.CYAN)}
              }
            }
          }
        })
      })
      if(!this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Set new hideout construction times`,LogTextColor.CYAN)}
      }// End construction time changes
    // Update scav case payments and rewards
    if (this.modConfig.modifyScavCase)
    {
      scavCase.forEach(newPayment =>
      {
        dbTables.hideout.scavcase.forEach(payment =>
        {
          if (payment._id == newPayment._id)
          {
            // Update requirements
            if (this.modConfig.scavCaseChanges.requirements)
            {
              payment.Requirements = newPayment.Requirements
              if(this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Changed Scav Case payment to ${payment.Requirements[0].templateId}`,LogTextColor.CYAN)}
            }
            // Update production time
            if (this.modConfig.scavCaseChanges.prodTime)
            {
              payment.ProductionTime = newPayment.ProductionTime
              if(this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Production time changed for Scav Case payment ${payment.Requirements[0].templateId}`,LogTextColor.CYAN)}
            }
            // Update end products
            if (this.modConfig.scavCaseChanges.rewards)
            {
              payment.EndProducts = newPayment.EndProducts
              if(this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Reward changed for Scav Case payment ${payment.Requirements[0].templateId}`,LogTextColor.CYAN)}
            }
          }
        })
      })
      if(!this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Updated Scav Case hideout area`,LogTextColor.CYAN)}
    }//End scav case changes
    // Update locales to reflect "new" hideout
    if (this.modConfig.includeLocaleChanges)
    {
      for (const locale in locales)
      {
        dbTables.locales.global[sysLang][locale] = locales[locale]
        if(this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Modified hideout locale: ${locale}`,LogTextColor.CYAN)}
      }
      if(!this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Updated hideout locales`,LogTextColor.CYAN)}
    }// End locale changes
    // Modify ONLY fuel filters for Generator stage 1 and stage 2
    if (this.modConfig.generatorFuelChangeOnly)
    {
      dbTables.hideout.areas.forEach(area =>
      {
        if (area.type == 4)
        {
          area.stages[1].bonuses.forEach(bonus =>
          {
            if (bonus.type == "AdditionalSlots")
            {
              bonus.filter = ["5d1b371186f774253763a656"]
              this.logger.logWithColor(`${this.modTitle}: Set Generator stage 1 fuel to kerosene ONLY`,LogTextColor.CYAN)
            }
          })
          area.stages[2].bonuses.forEach(bonus =>
            {
              if (bonus.type == "AdditionalSlots")
              {
                bonus.filter = ["5d1b36a186f7742523398433"]
                this.logger.logWithColor(`${this.modTitle}: Set Generator stage 2 fuel to gasoline ONLY`,LogTextColor.CYAN)
              }
            })
        }
      })
    }// End fuel changes
    // Import our new productions from productions.json
    if (this.modConfig.enableProductionChanges) {
      // Doing this so that TS will yell at us if the json is wack
      const productionData: IHideoutProduction[] = production;
      dbTables.hideout.production.push(...productionData);
    }// End production importing
  }
  public postSptLoad(container: DependencyContainer): void
  {
    // Apply changes to spt_data/server/configs/hideout
    if (this.modConfig.changeConfigValues)
    {
      const hideoutConfig: IHideoutConfig = this.configServer.getConfig<IHideoutConfig>(ConfigTypes.HIDEOUT)
      for (const value in this.modConfig.config)
      {
        for (const config in hideoutConfig)
        {
          if (config == value)
          {
            if(this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}:Current hideout config value for  ${config} is ${hideoutConfig[config]}`,LogTextColor.GRAY)}
            hideoutConfig[config] = this.modConfig.config[value]
            if(this.modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Adjusted to ${hideoutConfig[config]}`,LogTextColor.CYAN)}
          }
        }
      }
      if(!this.modConfig.verboseLogging){this.logger.logWithColor(`Hideout changes applied`,LogTextColor.CYAN)}
    }
  }
}
export const mod = new Mod();