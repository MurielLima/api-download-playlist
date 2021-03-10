import { container, injectable } from 'tsyringe';

@injectable()
class NormalizeTitleService {
    public constructor(){
    }
    public execute(title:string){
        // title = title.replace(/\&/g,'e').replace(/[\.\,\;\:]+/g,'')
        // title = title.replace(/\-/g,' ').replace(/\ /g, '-');
        title = title.replace(/\ {2,}/g, ' ').replace(/[\"\|\/\?]+/g,'');
        title = title.replace(/\//g,'').replace(/\*/g,'');
        title = this.removeAcento(title).trim();
        return title;
    }
    private removeAcento (text : string)
    {       
        text = text.replace(new RegExp('[ÁÀÂÃ]','gi'), 'a');
        text = text.replace(new RegExp('[ÉÈÊ]','gi'), 'e');
        text = text.replace(new RegExp('[ÍÌÎ]','gi'), 'i');
        text = text.replace(new RegExp('[ÓÒÔÕ]','gi'), 'o');
        text = text.replace(new RegExp('[ÚÙÛ]','gi'), 'u');
        text = text.replace(new RegExp('[Ç]','gi'), 'c');
        return text;                 
    }
}
export default NormalizeTitleService;

