export interface CreditProduct {
    productId: string;
    credits: number;
    price: number;
    label: string;
    recommended?: boolean;
}

export const CREDIT_PRODUCTS: CreditProduct[] = [
    {
        productId: "prod_212pOAdcdiymwyWOTJGJOs",
        credits: 50,
        price: 9,
        label: "入门包",
    },
    {
        productId: "prod_6zLM7EssfIVvKpwmfIaAtD",
        credits: 130,
        price: 19,
        label: "标准包",
        recommended: true,
    },
    {
        productId: "prod_7EwXJoeDZugEh9SHaxm2mY",
        credits: 300,
        price: 39,
        label: "专业包",
    },
];
