import { Component } from './decorators';

@Component({
    selector: 'other-bad',
    template: '<p>bad</p>'
})
export class BadComponent {
    public async load(): Promise<string> {
        return 'no await here';
    }

    public later(): void {}

    private hidden = 1;

    public static readonly KIND = 'bad';
}

export enum badLevel {
    low_value = 'low'
}

export const run = new Function('return 1');
export const shown = 'literal ${notATemplate}';
export const value: Function = () => 1;
