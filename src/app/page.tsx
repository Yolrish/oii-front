import {
  Create,
  CreateProvider
} from '@/components/page-create'


export default function Home() {
  return (
    <CreateProvider>
      <Create />
    </CreateProvider>
  );
}
