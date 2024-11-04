import Button from '../_components/Button';

export default function NotFound() {
  return (
    <article className='container flex flex-col items-center justify-center min-h-screen text-center space-y-6 '>
      <p>This page could not be found, sorry!</p>
      <div>
        <Button href='/' label='return to home' />
      </div>
    </article>
  );
}
