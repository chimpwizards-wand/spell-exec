import Debug from 'debug';
import { Command } from  '@chimpwizards/wand'
import { Config } from '@chimpwizards/wand'
import { CommandDefinition, CommandParameter, CommandArgument } from '@chimpwizards/wand/commons/command/'

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';  


const chalk = require('chalk');
const debug = Debug("w:cli:shell:script");

@CommandDefinition({ 
    description: 'Link external shell script to the cli',
    alias: 'x',
    parent: 'add',  //TODO: Get the parent from the folder structure
    examples: [
        [`add script ./scripts/new-release.sh`, `Link new-release.sh script to the cli`],
    ]
})
export class Script extends Command  { 

    @CommandArgument({ description: 'Script location', required: true})
    path: string = "";

    @CommandParameter({ description: 'Script name'})
    name: string= "";  

    execute(yargs: any): void {
        var config = new Config();
        var context = config.load({});
        var scripts : any= { scripts: {}}

        let name: string = this.name || this.path.split("/").reverse()[0].split(".")[0]
        scripts.scripts[name] = this.path
        var newConfig = _.merge({}, context, scripts);
        config.save({context: newConfig})
    }

}

export function register ():any {
    debug(`Registering....`)
    let command = new Script();
    debug(`INIT: ${JSON.stringify(Object.getOwnPropertyNames(command))}`)

    return command.build()
}

