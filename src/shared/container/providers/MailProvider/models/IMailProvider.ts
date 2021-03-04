import ISendMailDTO from "../dtos/ISendMailDTO";

export default interface IMailProvider{
    sendMail(message:ISendMailDTO):Promise<void>;
}
