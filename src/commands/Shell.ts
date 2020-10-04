import Debug from 'debug';
import { Command } from  '@chimpwizards/wand'
import { Config } from '@chimpwizards/wand'
import { Execute } from '@chimpwizards/wand'
import { CommandDefinition, CommandParameter, CommandArgument } from '@chimpwizards/wand/commons/command/index'
import * as _ from 'lodash';  
import * as path from 'path';
import * as fs from 'fs';

const progress = require('cli-progress');
const chalk = require('chalk')
const debug = Debug("w:cli:shell");

@CommandDefinition({ 
    description: 'Execute a command across all packages/components',
    alias: 'x',
    examples: [
        [`shell 'git commit -am "Update changes"'`, `Execute "git commit.." command in all packages folders`],
        [`shell --- git commit -am "Update changes"`, `Execute "git commit.." command in all packages folders`],
        [`shell --no-root 'ls -la'`, `Execute "ls -la" command except on the root folder`],
        [`shell --filter hello-world pwd`, `execute the "pwd" command on the packages's name matching "hello-world"`],
        [`shell --current 'ls -la'`, `Execute "ls -la" command only in current folder`],
        [`shell git status`, `Execute "git status" command (notice that no need to use " around the command)`],
    ]
})
export class Shell extends Command  { 

    @CommandArgument({ description: 'Command to execute', name: 'shell-command'})
    @CommandParameter({ description: 'Command to execute', alias: 'c'})
    command: string = '';

    @CommandParameter({ description: 'Include root folder', defaults: true})
    root: boolean = true;

    @CommandParameter({ description: 'Include dependencies folders', defaults: true})
    dependencies: boolean = true;

    @CommandParameter({ description: 'Show more inforamtion about the execution', defaults: false})
    verbose: boolean = false;    

    @CommandParameter({ description: 'Filter Package/Component name ising this filter/search criteria where the command will be executed', defaults: '*'})
    filter: string = "*";

    @CommandParameter({ description: 'Tag(s) to use to filter components. if several are provided it will be use with AND condition'})
    tags: string = "";


    @CommandParameter({ description: 'Execute command in current folder', defaults: false})
    current: boolean = false;

    execute(yargs: any): void {
        debug(`Exec ${this.command}`)
        debug(`THIS ${JSON.stringify(this)}`)
        debug(`YARGS ${JSON.stringify(yargs)}`)

        const args = process.argv.slice(3);
        debug(`ARGS ${JSON.stringify(args)}`)
       
        let self = this;
        const executer = new Execute();

        const cwd = process.cwd();
        const config: any = new Config();
        const context = config.load({})
        debug(`CONFIG: ${context}`)

        let cmd = this.command;

        if ( context.scripts && context.scripts[this.command]) {
            debug(`Command is registered inside .wand/config`)
            cmd = path.join(context.local.root,context.scripts[this.command])
        } else {
            debug(`Command is registered inside package.json`)
            let packagePath = path.join(
                context.local.root,
                'package.json'
            ) 
            if ( fs.existsSync(packagePath) ) {
                let info = require(packagePath);
                if (info && info.scripts) {
                    if (info.scripts[this.command]) {
                        cmd = info.scripts[this.command]
                    }
                }
            }
        }


        //Attach the rest of the command. Assuming no quotes were used eg: '<command'
        let wholething = args.join(" ");
        if (wholething.indexOf("---")>=0) {
            cmd = args.join(" ").substring(args.join(" ").indexOf("---")+4)
                .replace("::","|")
                .replace("!!","|")
        }

        let rest = wholething.substring(wholething.indexOf(this.command)+this.command.length)
        cmd = cmd + rest


        const bar = new progress.SingleBar({
            format: 'Processing |' + chalk.cyan('{bar}') + '| {percentage}% || {value}/{total} Dependencies || {dependency}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });

        let dependencies = []

        if ( this.current) {
            debug(`Execute command on current folder`)
            dependencies.push({ 
                cmd: cmd, 
                folder: process.cwd(), 
                output: this.verbose,
                dependency: "current",
                tags: []
            })
        } else {
            debug(`Current flag disable. Check the other two options`)

            //Add root
            if (this.root) {
                debug(`Execute command on dependencies`)
                dependencies.push({ 
                    cmd: cmd, 
                    folder: context.local.root, 
                    output: this.verbose,
                    dependency: "root",
                    tags: []
                })
            }

            //Add dependencies
            if (this.dependencies) {
                if(context) {
                    _.each(context.dependencies||[], (pack, name) => {
                        dependencies.push({ 
                            cmd: cmd, 
                            folder: path.join(context.local.root, pack.path), 
                            output: this.verbose,
                            dependency: pack.path,
                            tags: pack.tags
                        })
                    })
                }
            }
        }

        //Filter by tags if rovided
        if (this.tags.length>0) {
            let tmp: any = []
            let query = self.tags.split(",")
            _.each(dependencies, (pack, name) => {
                let diff = _.difference(query, pack.tags)
                if ( diff.length == 0) {
                    tmp.push(pack)
                }
            })
            dependencies = tmp;
        }

        //Filter by filter/regexpr
        if (this.filter != "*") {
            let tmp: any = []
            
            _.each(dependencies, (pack, name) => {
                debug(`Marching: ${pack.dependency}`)
                var matcher = new RegExp(self.filter ,"gi");
                let test = matcher.test(pack.dependency);
                if (test) {
                    tmp.push(pack)
                }
            })
            dependencies = tmp;
        }


        bar.start(dependencies.length, 0, {
            dependency: "Preparing"
        });
        
        debug(`CONFIG ${JSON.stringify(context)}`)
        _.each(dependencies, (pack, name) => {
            debug(`EXECUTING (${name}): ${cmd}`)
            executer.run( {
                cmd: cmd, 
                folder: pack.folder, 
                output: this.verbose
            })

            bar.increment({dependency: pack.dependency});

        });
        


        

        bar.stop();
    }

}

export function register ():any {
    debug(`Registering....`)
    let command = new Shell();
    debug(`INIT: ${JSON.stringify(Object.getOwnPropertyNames(command))}`)

    return command.build()
}

