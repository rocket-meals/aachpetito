export class StringHelper {

    // also be able to replace "*" with "WILDCARD_REPLACEMENT"
    static replaceAll(str: string, find: string, replace: string) {
        return str.replace(new RegExp(find, 'g'), replace);
    }

}