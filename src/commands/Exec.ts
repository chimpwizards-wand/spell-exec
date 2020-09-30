import Debug from 'debug';
import { Command } from  '@chimpwizards/wand'
import { Config } from '@chimpwizards/wand'
import { Execute } from '@chimpwizards/wand'
import { CommandDefinition, CommandParameter, CommandArgument } from '@chimpwizards/wand/commons/command'
import * as _ from 'lodash';  

const chalk = require('chalk');
const debug = Debug("w:cli:exec");

@CommandDefinition({ 
    description: 'Execute a command across all packages/components',
    alias: 'x',
    examples: [
        [`exec 'git commit -am "Update changes"'`, `Execute "git commit.." command in all packages folders`],
        [`exec --- git commit -am "Update changes"`, `Execute "git commit.." command in all packages folders`],
        [`exec --no-root 'ls -la'`, `Execute "ls -la" command except on the root folder`],
        [`exec --filter hello-world pwd`, `execute the "pwd" command on the packages's name matching "hello-world"`],
    ]
})
export class Exec extends Command  { 

    @CommandArgument({ description: 'Command to execute', name: 'exec-command'})
    @CommandParameter({ description: 'Command to execute', alias: 'c'})
    command: string = '';

    @CommandParameter({ description: 'Include root folder', defaults: true})
    root: boolean = true;

    @CommandParameter({ description: 'Include packages folders', defaults: true})
    packages: boolean = true;

    @CommandParameter({ description: 'Filter Package/Component name ising this filter/search criteria where the command will be executed'})
    filter: string = "*";


    execute(yargs: any): void {
        debug(`Exec ${this.command}`)
        debug(`THIS ${JSON.stringify(this)}`)
        debug(`YARGS ${JSON.stringify(yargs)}`)

        const args = process.argv.slice(3);
        debug(`ARGS ${JSON.stringify(args)}`)
       

        const executer = new Execute();
        
        let cmd = this.command;

        if (args.join(" ").indexOf("---")>=0) {
            cmd = args.join(" ").substring(args.join(" ").indexOf("---")+4)
                .replace("::","|")
                .replace("!!","|")
        }

        //Execute on Root
        if (this.root) executer.run({cmd: cmd})

        // _.each(config.components||[], (component, name) => {
        //Execut for each package
        if (this.packages) {
            const config = new Config();
            const context = config.load()
            let self = this;
            debug(`CONFIG ${JSON.stringify(context)}`)
            if(context) {
                _.each(context.packages||[], (pack, name) => {
                    let doit: boolean = true;
                    if (self.filter != "*") {
                        debug(`FIND packages that incldues ${self.filter}`)
                        var matcher = new RegExp(self.filter ,"gi");
                        if (matcher.test(name)) {
                            doit = true;
                        }
                    }
                    if (doit) executer.run({folder:pack.path, cmd: cmd})
                });
            }
        }
    }

}

export function register ():any {
    debug(`Registering....`)
    let command = new Exec();
    debug(`INIT: ${JSON.stringify(Object.getOwnPropertyNames(command))}`)

    return command.build()
}
