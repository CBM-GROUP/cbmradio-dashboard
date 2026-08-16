import ArticleEditorPage from "../../../../components/articles/article-editor-page";
export default async function EditArticlePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <ArticleEditorPage slug={slug}/>;}
