interface Props { title: string; description?: string; eyebrow?: string }
export default function PageHeading({ title, description, eyebrow }: Props) {
  return <div className="page-heading">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1 className="text-3xl">{title}</h1>{description && <p>{description}</p>}</div>
}
