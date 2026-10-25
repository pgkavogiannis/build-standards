import { Component, Directive } from './decorators';

@Component({
    selector: 'app-good',
    template: '<p>good</p>'
})
export class GoodComponent {
    public static readonly KIND = 'good';

    public greet(name: string): string {
        return `hello ${name}`;
    }
}

@Directive({ selector: '[appHighlight]' })
export class HighlightDirective {}

export enum Level {
    LOW = 'low',
    High = 'high'
}
