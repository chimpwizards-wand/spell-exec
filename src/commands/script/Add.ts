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
    alias: 'a',
    parent: 'script',  //TODO: Get the parent from the folder structure
    examples: [
        [`w shell script add ./scripts/hello.sh`, `Link hello.sh script to the cli`],
    ]
})
export class Add extends Command  { 

    @CommandArgument({ description: 'Script location', required: true})
    path: string = "";

    @CommandParameter({ description: 'Script name', alias: 'n',})
    name: string= "";  

    @CommandParameter({ description: 'Set command to run just in current folder', alias: 'c', defaults: false})
    current: boolean = false;

    @CommandParameter({ description: 'Set command to be verbose by default', alias: 'v', defaults: false})
    verbose: boolean = false;  

    execute(yargs: any): void {
        var config = new Config();
        var context = config.load({});
        var scripts : any= { scripts: {}}

        let name: string = this.name || this.path.split("/").reverse()[0].split(".")[0]
        scripts.scripts[name] = {
            command: this.path,
        }

        if ( this.current ) {
            scripts.scripts[name]['current'] = this.current
        }

        if ( this.verbose ) {
            scripts.scripts[name]['verbose'] = this.verbose
        }        
        
        var newConfig = _.merge({}, context, scripts);
        config.save({context: newConfig})
    }

}

export function register ():any {
    debug(`Registering....`)
    let command = new Add();
    debug(`INIT: ${JSON.stringify(Object.getOwnPropertyNames(command))}`)

    return command.build()
}

